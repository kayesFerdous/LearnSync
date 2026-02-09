from typing import Optional
from fastapi import Request
from langchain_qdrant import QdrantVectorStore, RetrievalMode
from qdrant_client import AsyncQdrantClient
from langchain_ollama import OllamaEmbeddings
from langchain_qdrant import FastEmbedSparse

from src.core.config import settings


# Module-level cached instances for background tasks
_qdrant_client: AsyncQdrantClient | None = None
_dense_embedding: OllamaEmbeddings | None = None
_sparse_embedding: FastEmbedSparse | None = None


def _get_qdrant_client() -> AsyncQdrantClient:
    """Get or create Qdrant client for background tasks."""
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = AsyncQdrantClient(url=settings.QDRANT_URL)
    return _qdrant_client


def _get_dense_embedding() -> OllamaEmbeddings:
    """Get or create dense embeddings for background tasks."""
    global _dense_embedding
    if _dense_embedding is None:
        _dense_embedding = OllamaEmbeddings(
            model=settings.OLLAMA_EMBEDDING_MODEL,
            base_url=settings.OLLAMA_URL
        )
    return _dense_embedding


def _get_sparse_embedding() -> FastEmbedSparse:
    """Get or create sparse embeddings for background tasks."""
    global _sparse_embedding
    if _sparse_embedding is None:
        _sparse_embedding = FastEmbedSparse(model_name="Qdrant/bm25")
    return _sparse_embedding


def get_vector_store(request: Optional[Request] = None) -> QdrantVectorStore:
    """
    Returns the hybrid vector store.
    
    If request is provided, uses cached instances from app.state (preferred for routes).
    If request is None, uses module-level cached instances (for background tasks).
    """
    if request is not None:
        # Use app.state (lifespan-managed) - preferred
        return QdrantVectorStore(
            client=request.app.state.qdrant_client,
            collection_name=settings.QDRANT_COLLECTION_NAME,
            embedding=request.app.state.dense_embedding,
            sparse_embedding=request.app.state.sparse_embedding,
            vector_name="dense",
            sparse_vector_name="sparse",
            retrieval_mode=RetrievalMode.HYBRID,
        )
    else:
        # Use module-level cache (for background tasks)
        return QdrantVectorStore(
            client=_get_qdrant_client(),
            collection_name=settings.QDRANT_COLLECTION_NAME,
            embedding=_get_dense_embedding(),
            sparse_embedding=_get_sparse_embedding(),
            vector_name="dense",
            sparse_vector_name="sparse",
            retrieval_mode=RetrievalMode.HYBRID,
        )
