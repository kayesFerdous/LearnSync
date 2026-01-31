import os
import tempfile
import logging
from uuid import uuid4, UUID
from typing import Optional, List
from langchain_core.language_models.chat_models import BaseChatModel
from pydantic import BaseModel, Field

from src.services.storage.r2 import get_r2_client
from src.core.config import settings
from src.rag.ingestion import parse_and_chunk_file, index_documents
from langchain_google_genai import ChatGoogleGenerativeAI
from src.conversations.model import File, ProcessingStatus
from src.db.session import AsyncSessionLocal
from sqlalchemy import select

logger = logging.getLogger(__name__)


class FileMetadata(BaseModel):
    summary: str = Field(description="A comprehensive academic summary of the document, at least 3-4 paragraphs. It should cover the main concepts, definitions, and key takeaways.")
    topics: List[str] = Field(description="List of key academic topics or concepts covered in the document.")
    doc_type: str = Field(description="The type of document (e.g., Lecture Notes, Exam, Syllabus, Textbook Chapter, Research Paper).")


async def _generate_metadata(text_content: str, filename: str, llm: BaseChatModel) -> FileMetadata:
    """
    Generates structured academic metadata using Gemini.
    """
    structured_llm = llm.with_structured_output(FileMetadata)
    
    # Limit context to avoid excessive token usage.
    # 100k characters is roughly 25k tokens.
    input_text = text_content[:100000]
    
    prompt = f"""
    You are an expert academic assistant helping a student organize their study materials.
    Analyze the document content provided below to generate structured metadata.
    
    Filename: {filename}
    
    <document_text>
    {input_text}
    </document_text>
    """
    
    return await structured_llm.ainvoke(prompt) #type: ignore


async def process_content(
    source: str,
    user_id: str,
    llm: ChatGoogleGenerativeAI,
    original_filename: Optional[str] = None,
    is_url: bool = False,
    file_id: Optional[str] = None,
    folder_id: Optional[str] = None,
    conversation_id: Optional[str] = None
):
    """
    Background task to process content.
    Expects 'file_id' to update existing record.
    """
    tmp_path = None
    processing_source = source
    
    try:
        logger.info(f"Starting processing for: {source} (User: {user_id}, FileID: {file_id})")
        
        # 0. Update Status to PROCESSING & Check Cancellation
        if file_id:
             async with AsyncSessionLocal() as session:
                result = await session.execute(select(File).where(File.id == UUID(file_id)))
                file_record = result.scalar_one_or_none()
                if file_record:
                    if file_record.status == ProcessingStatus.CANCELLED:
                        logger.info(f"File {file_id} was cancelled before processing started.")
                        return # Stop immediately
                    
                    file_record.status = ProcessingStatus.PROCESSING
                    await session.commit()
        
        # Generate a document ID (for RAG metadata)
        document_id = str(uuid4())

        if not is_url:
            # Handle R2 Download
            r2 = await get_r2_client()
            
            # Check cancellation before download
            if file_id:
                async with AsyncSessionLocal() as session:
                    result = await session.execute(select(File).where(File.id == UUID(file_id)))
                    file_rec = result.scalar_one_or_none()
                    if file_rec and file_rec.status == ProcessingStatus.CANCELLED:
                        logger.info(f"File {file_id} cancelled. Deleting from R2.")
                        try:
                            r2.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=source)
                        except Exception as e:
                            logger.warning(f"Failed to delete R2 object {source}: {e}")
                        return

            # Create a temp file to store the download
            file_ext = os.path.splitext(source)[1]
            if not file_ext and original_filename:
                 file_ext = os.path.splitext(original_filename)[1]
            if not file_ext:
                file_ext = ".pdf" # Default fallback
                
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
                tmp_path = tmp_file.name
                
            logger.debug(f"Downloading {source} to {tmp_path}")
            r2.download_file(settings.R2_BUCKET_NAME, source, tmp_path)
            processing_source = tmp_path
        
        # 2. Parse & Chunk
        logger.info(f"Parsing and chunking content from {processing_source}...")
        
        # Check cancellation before heavy parsing
        if file_id:
             async with AsyncSessionLocal() as session:
                result = await session.execute(select(File).where(File.id == UUID(file_id)))
                file_rec = result.scalar_one_or_none()
                if file_rec and file_rec.status == ProcessingStatus.CANCELLED:
                     logger.info(f"File {file_id} cancelled during parsing.")
                     return

        documents = parse_and_chunk_file(
            processing_source, 
            user_id, 
            document_id,
            folder_id=str(folder_id) if folder_id else None,
            conversation_id=str(conversation_id) if conversation_id else None
        )
        
        if not documents:
            raise ValueError(f"No content extracted from {source}")

        # 3. Vector Store Ingestion
        logger.info("Ingesting chunks into Vector Store...")
        
        # Check cancellation before embedding (expensive)
        if file_id:
             async with AsyncSessionLocal() as session:
                result = await session.execute(select(File).where(File.id == UUID(file_id)))
                file_rec = result.scalar_one_or_none()
                if file_rec and file_rec.status == ProcessingStatus.CANCELLED:
                     logger.info(f"File {file_id} cancelled before embedding.")
                     return

        await index_documents(documents)
        
        # 4. Gemini Metadata Extraction
        logger.info("Generating academic metadata with Gemini...")
        # Combine text from chunks for context
        full_text = "\n\n".join([doc.page_content for doc in documents])
        current_filename = original_filename or os.path.basename(source)
        metadata = await _generate_metadata(full_text, current_filename, llm)
        
        # 5. DB Save / Update
        logger.info("Saving file record to database...")
        async with AsyncSessionLocal() as session:
            if file_id:
                # Update existing record
                result = await session.execute(select(File).where(File.id == UUID(file_id)))
                file_record = result.scalar_one_or_none()
                if file_record:
                    file_record.summary = metadata.summary
                    file_record.topics = metadata.topics
                    file_record.doc_type = metadata.doc_type
                    file_record.status = ProcessingStatus.COMPLETED
                    await session.commit()
                    logger.info(f"File {file_id} marked as COMPLETED")
            else:
                # Create new record (Legacy fallback for process_url if not updated)
                new_file = File(
                    user_id=UUID(user_id),
                    filename=original_filename or os.path.basename(source),
                    file_path=source,
                    summary=metadata.summary,
                    topics=metadata.topics,
                    doc_type=metadata.doc_type,
                    status=ProcessingStatus.COMPLETED,
                    folder_id = UUID(folder_id) if folder_id else None,
                    conversation_id=UUID(conversation_id) if conversation_id else None
                )
                session.add(new_file)
                await session.commit()
                logger.info(f"Created new file record with ID: {new_file.id}")
        
        logger.info(f"Successfully processed {source}")
        
    except Exception as e:
        logger.error(f"Error processing {source}: {e}", exc_info=True)
        if file_id:
             async with AsyncSessionLocal() as session:
                result = await session.execute(select(File).where(File.id == UUID(file_id)))
                file_record = result.scalar_one_or_none()
                if file_record:
                    file_record.status = ProcessingStatus.FAILED
                    file_record.error_message = str(e)
                    await session.commit()
        
    finally:
        # 6. Cleanup temp file if it exists
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file {tmp_path}: {e}")
