from typing import Optional
from fastapi import Request
from langchain_core.documents import Document

from .store import get_vector_store


async def retrieve_documents_by_id(
    document_id: str,
    k: int = 100,
    request: Optional[Request] = None
) -> list[Document]:
    """
    Returns Documents based on document_id metadata filter.
    """
    store = get_vector_store(request)
    
    # Use Qdrant's filter to get documents by document_id
    results = await store.asimilarity_search(
        query="",  # Empty query, we're filtering by metadata
        k=k,
        filter={"must": [{"key": "document_id", "match": {"value": document_id}}]}
    )
    
    return results


async def retrieve_documents(
    query: str,
    k: int = 5,
    filter_metadata: dict | None = None,
    request: Optional[Request] = None
) -> list[Document]:
    """
    Async hybrid retrieval using Qdrant.
    Combines dense (semantic) and sparse (BM25) search automatically.
    """
    store = get_vector_store(request)
    
    # Qdrant handles hybrid (dense + sparse) internally
    results = await store.asimilarity_search(
        query, 
        k=k,
        filter=filter_metadata
    )
    return results


async def get_retriever(
    k: int = 10,
    filter_metadata: dict | None = None,
    request: Optional[Request] = None
):
    """
    Returns a retriever for use with LangChain chains.
    """
    store = get_vector_store(request)
    return store.as_retriever(
        search_kwargs={"k": k, "filter": filter_metadata}
    )
