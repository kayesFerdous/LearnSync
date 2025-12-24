
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
    app.state.gemini_llm = await setup_gemini_llm(model="gemini-2.5-flash", max_tokens=900000)
    app.state.gemini_llm_temp_0 = await setup_gemini_llm(temperature=0, max_tokens=900000)
    app.state.chat_workflow = await build_chat_graph(
        groq_llm=app.state.groq_llm, 
        gemini_llm=app.state.gemini_llm,
        gemini_llm_temp_0=app.state.gemini_llm_temp_0
    )
    # app.state.bot = await ChatBot.from_pdf()
    yield
