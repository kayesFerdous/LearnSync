import os
import tempfile
import logging
from uuid import uuid4, UUID
from typing import Optional, List
from pydantic import BaseModel, Field

from src.services.storage.r2 import get_r2_client
from src.core.config import settings
from src.rag.ingestion import parse_and_chunk_file, get_vector_store
from langchain_google_genai import ChatGoogleGenerativeAI
from src.conversations.model import File
from src.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)

class FileMetadata(BaseModel):
    summary: str = Field(description="A comprehensive academic summary of the document, at least 3-4 paragraphs. It should cover the main concepts, definitions, and key takeaways.")
    topics: List[str] = Field(description="List of key academic topics or concepts covered in the document.")
    doc_type: str = Field(description="The type of document (e.g., Lecture Notes, Exam, Syllabus, Textbook Chapter, Research Paper).")

async def _generate_metadata(text_content: str, llm: ChatGoogleGenerativeAI) -> FileMetadata:
    """
    Generates structured academic metadata using Gemini.
    """
    structured_llm = llm.with_structured_output(FileMetadata)
    
    # Limit context to avoid excessive token usage, though Gemini handles large context well.
    # 100k characters is roughly 25k tokens.
    input_text = text_content[:100000]
    
    prompt = f"""
    Analyze the following academic text and provide structured metadata.
    Ensure the summary is detailed (not too small) and useful for study purposes.
    
    Text Content:
    {input_text}
    """
    
    return await structured_llm.invoke(prompt)

async def process_content(
    source: str,
    user_id: str,
    llm: ChatGoogleGenerativeAI,
    original_filename: Optional[str] = None,
    is_url: bool = False,
    folder_id: Optional[str] = None,
    conversation_id: Optional[str] = None
):
    """
    Background task to process content (File from R2 or direct URL):
    1. If R2: Download to temp.
    2. Parse & Chunk (Docling).
    3. Ingest to Vector Store.
    4. Generate Metadata (Gemini).
    5. Save to Postgres (File table).
    6. Cleanup.
    """
    tmp_path = None
    processing_source = source
    
    try:
        logger.info(f"Starting processing for: {source} (User: {user_id}, URL: {is_url})")
        
        # Generate a document ID
        document_id = str(uuid4())

        if not is_url:
            # Handle R2 Download
            r2 = await get_r2_client()
            
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
        documents = parse_and_chunk_file(
            processing_source, 
            user_id, 
            document_id,
            folder_id=str(folder_id) if folder_id else None,
            conversation_id=str(conversation_id) if conversation_id else None
        )
        
        if not documents:
            logger.warning(f"No content extracted from {source}")
            return

        # 3. Vector Store Ingestion
        logger.info("Ingesting chunks into Vector Store...")
        vector_store = await get_vector_store()
        await vector_store.aadd_documents(documents)
        
        # 4. Gemini Metadata Extraction
        logger.info("Generating academic metadata with Gemini...")
        # Combine text from chunks for context
        full_text = "\n\n".join([doc.page_content for doc in documents])
        metadata = await _generate_metadata(full_text, llm)
        
        # 5. DB Save
        logger.info("Saving file record to database...")
        async with AsyncSessionLocal() as session:
            new_file = File(
                user_id=UUID(user_id),
                filename=original_filename or os.path.basename(source),
                file_path=source,
                summary=metadata.summary,
                topics=metadata.topics,
                doc_type=metadata.doc_type,
                folder_id = UUID(folder_id) if folder_id else None,
                conversation_id=UUID(conversation_id) if conversation_id else None
            )
            session.add(new_file)
            await session.commit()
            logger.info(f"File saved with ID: {new_file.id}")
        
        logger.info(f"Successfully processed {source}")
        
    except Exception as e:
        logger.error(f"Error processing {source}: {e}", exc_info=True)
        # TODO: Here you would update the DB status to 'FAILED'
        
    finally:
        # 6. Cleanup temp file if it exists
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file {tmp_path}: {e}")
