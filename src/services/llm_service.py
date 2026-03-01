from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic.types import SecretStr

from ..core.config import settings


async def setup_route_intent_llm():
    from src.agents.model import Route

    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
        max_tokens=50,
        api_key=SecretStr(settings.GROQ_API_KEY),
    )
    return llm.with_structured_output(Route)


async def setup_groq_llm(
    model: str = "openai/gpt-oss-20b",
    temperature: float = 0.4,
    max_tokens: int = 250,
) -> ChatGroq:
    return ChatGroq(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=SecretStr(settings.GROQ_API_KEY),
    )


async def setup_gemini_llm(
    model: str = "gemini-3-flash-preview",
    temperature: float = 0.4,
    max_tokens: int = 250,
) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=settings.GOOGLE_API_KEY,
    )

