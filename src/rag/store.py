from typing import Optional

from langchain_qdrant import QdrantVectorStore, RetrievalMode
from qdrant_client import QdrantClient
from langchain_ollama import OllamaEmbeddings
from langchain_qdrant import FastEmbedSparse

from src.core.config import settings


# Module-level cached instances for background tasks
_qdrant_client: QdrantClient | None = None
_dense_embedding: OllamaEmbeddings | None = None
_sparse_embedding: FastEmbedSparse | None = None


def _get_qdrant_client() -> QdrantClient:
    """Get or create Qdrant client."""
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(url=settings.QDRANT_URL)
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


def get_vector_store() -> QdrantVectorStore:
    """
    Returns the hybrid vector store using module-level cached instances.
    """
    return QdrantVectorStore(
        client=_get_qdrant_client(),
        collection_name=settings.QDRANT_COLLECTION_NAME,
        embedding=_get_dense_embedding(),
        sparse_embedding=_get_sparse_embedding(),
        vector_name="dense",
        sparse_vector_name="sparse",
        retrieval_mode=RetrievalMode.HYBRID,
    )
