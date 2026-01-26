from contextlib import asynccontextmanager

from fastapi import FastAPI

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
