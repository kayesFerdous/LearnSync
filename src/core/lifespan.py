
from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.agents.graph import build_chat_graph
from src.services.llm_service import setup_gemini_llm, setup_groq_llm
from src.core.logging_config import setup
# from src.workflows.chat_workflow import ChatBot

@asynccontextmanager
async def lifespan(app: FastAPI):
    await setup()
    app.state.groq_llm = await setup_groq_llm()
    app.state.gemini_llm = await setup_gemini_llm(max_tokens=900000)
    app.state.chat_workflow = await build_chat_graph(
        groq_llm=app.state.groq_llm, 
        gemini_llm=app.state.gemini_llm
    )
    # app.state.bot = await ChatBot.from_pdf()
    yield
