from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from src.core.config import settings


async def get_embeddings_model(model="models/gemini-embedding-001"):
    return GoogleGenerativeAIEmbeddings(
        model=model,
        google_api_key=settings.GOOGLE_API_KEY, #type: ignore
    )


async def get_vector_store(
    collection_name:str = "rag_collection",
    persist_directory:str="./chroma_langchain_db"
):
    return Chroma(
        collection_name,
        embedding_function= await get_embeddings_model(),
        persist_directory=persist_directory
    )
