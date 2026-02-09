from contextlib import asynccontextmanager

from fastapi import FastAPI
from qdrant_client import AsyncQdrantClient
from qdrant_client.http.models import Distance, VectorParams, SparseVectorParams
from langchain_ollama import OllamaEmbeddings
from langchain_qdrant import FastEmbedSparse

from src.agents.graph import build_graph
from src.services.llm_service import setup_gemini_llm, setup_groq_llm
from src.core.logging_config import setup
from src.core.config import settings
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from src.services.storage.r2 import get_r2_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup()
    app.state.groq_llm = await setup_groq_llm()
    app.state.gemini_llm = await setup_gemini_llm(model="gemini-2.5-flash", max_tokens=900000)
    app.state.gemini_llm_temp_0 = await setup_gemini_llm(temperature=0, max_tokens=900000)
    app.state.r2_client = await get_r2_client()

    # Qdrant Client (async)
    app.state.qdrant_client = AsyncQdrantClient(url=settings.QDRANT_URL)
    
    # Ensure collection exists
    if not await app.state.qdrant_client.collection_exists(settings.QDRANT_COLLECTION_NAME):
        await app.state.qdrant_client.create_collection(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            vectors_config={"dense": VectorParams(size=settings.QDRANT_VECTOR_DIM, distance=Distance.COSINE)},
            sparse_vectors_config={"sparse": SparseVectorParams()},
        )
    
    # Embeddings (cached - avoids tokenizer reload per request)
    app.state.dense_embedding = OllamaEmbeddings(
        model=settings.OLLAMA_EMBEDDING_MODEL,
        base_url=settings.OLLAMA_URL
    )
    app.state.sparse_embedding = FastEmbedSparse(model_name="Qdrant/bm25")

    postgres_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    
    async with AsyncPostgresSaver.from_conn_string(postgres_url) as checkpointer:
        await checkpointer.setup()
        app.state.chat_workflow = await build_graph(
            groq_llm=app.state.groq_llm, 
            gemini_llm=app.state.gemini_llm,
            gemini_llm_temp_0=app.state.gemini_llm_temp_0,
            checkpointer=checkpointer
        )
        yield
    
    # Cleanup
    await app.state.qdrant_client.close()
