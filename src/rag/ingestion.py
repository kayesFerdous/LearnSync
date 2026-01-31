from typing import List, Optional

from docling.document_converter import DocumentConverter
from docling_core.transforms.chunker.doc_chunk import DocChunk
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from langchain_core.documents import Document

from .store import get_vector_store


def _create_metadata_from_chunk(
    chunk: DocChunk,
    user_id: str,
    document_id: str,
    folder_id: Optional[str] = None,
    conversation_id: Optional[str] = None,
) -> dict:
    """
    Extracts and standardizes metadata from a Docling chunk.
    """
    meta = chunk.meta
    
    filename = meta.origin.filename if meta.origin else "unknown_file"
    
    page_number = 0
    if meta.doc_items and meta.doc_items[0].prov:
        page_number = meta.doc_items[0].prov[0].page_no
        
    headings = meta.headings if meta.headings else []
    section_context = " > ".join(headings)
    
    # Extract content type (e.g., 'table', 'list_item', 'text')
    content_type = "text"
    if meta.doc_items:
        # label is typically an enum, converting to string and cleaning
        content_type = str(meta.doc_items[0].label).split(".")[-1].lower()

    metadata = {
        "source": filename,
        "page": page_number,
        "section": section_context,
        "type": content_type,
        "user_id": user_id,
        "document_id": document_id
    }

    if folder_id:
        metadata["folder_id"] = folder_id
    
    if conversation_id:
        metadata["conversation_id"] = conversation_id
        
    return metadata


def _convert_chunk_to_document(
    chunk: DocChunk,
    user_id: str,
    document_id: str,
    folder_id: Optional[str] = None,
    conversation_id: Optional[str] = None,
) -> Document:
    """
    Converts a single Docling chunk into a LangChain Document.
    """
    metadata = _create_metadata_from_chunk(chunk, user_id, document_id, folder_id, conversation_id)
    section_context = metadata.get("section", "")
    
    # Prepend context to text for better retrieval context
    page_content = f"Context: {section_context}\nContent: {chunk.text}" if section_context else chunk.text

    return Document(page_content=page_content, metadata=metadata)


def parse_and_chunk_file(
    file_path: str,
    user_id: str,
    document_id: str,
    folder_id: Optional[str] = None,
    conversation_id: Optional[str] = None,
    max_tokens: int = 500
) -> List[Document]:
    """
    Loads a file, converts it using Docling, splits it into chunks, 
    and formats them as LangChain Documents.
    """
    converter = DocumentConverter()
    conversion_result = converter.convert(file_path)

    chunker = HybridChunker(
        max_tokens=max_tokens, #type: ignore
        merge_peers=True
    )

    chunk_iterator = chunker.chunk(conversion_result.document)

    documents: List[Document] = []
    for chunk in chunk_iterator:
        # The chunker returns DocChunk objects, we convert them to LangChain Documents
        document = _convert_chunk_to_document(chunk, user_id, document_id, folder_id, conversation_id) #type: ignore 
        documents.append(document)

    return documents


async def index_documents(
    documents: List[Document],
    collection_name: Optional[str] = None
) -> None:
    """
    Indexes a list of documents into the vector store.
    """
    if not documents:
        return

    # Pass collection_name if provided, otherwise get_vector_store uses its default
    if collection_name:
        vector_store = await get_vector_store(collection_name=collection_name)
    else:
        vector_store = await get_vector_store()
        
    await vector_store.aadd_documents(documents)


async def ingest_file(
    file_path: str,
    user_id: str,
    document_id: str,
    folder_id: Optional[str] = None,
    conversation_id: Optional[str] = None,
    collection_name: Optional[str] = None
) -> None:
    """
    Orchestrates the full ingestion process: Parse -> Chunk -> Index.
    """
    documents = parse_and_chunk_file(file_path, user_id, document_id, folder_id, conversation_id)
    await index_documents(documents, collection_name)
