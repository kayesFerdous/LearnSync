from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic.types import SecretStr

from ..core.config import settings

# Use the chat history and retrieved context to answer the user's question as clearly and conversationally as possible.
    # Context:
    # {context}
async def setup_prompt_template():
    RAG_PROMPT_WITH_HISTORY = """
    You are Kayes' friendly and knowledgeable AI assistant, designed to help visitors learn about Kayes' work, experience, and skills. 
    Use the chat history to answer the user's question as clearly and conversationally as possible.

    - Be friendly and approachable — keep answers short, clear, and helpful.
    - If the answer involves projects or experience, give a quick summary (2–3 sentences max).
    - If the answer involves skills or tools, present them in a neat list when possible.
    - If you don't find the answer in the context, say you don't know — do NOT make anything up.

    Chat History:
    {chat_history}

    Question:
    {question}

    Answer:
    """
    return PromptTemplate(
        template=RAG_PROMPT_WITH_HISTORY,
        input_variables=["chat_history", "context", "question"]
    )


# async def setup_vector_store(
#     collection_name:str,
#     persist_directory:str="./chroma_langchain_db"
# ):
#     return Chroma(
#         collection_name,
#         embedding_function= await setup_embeddings(),
#         persist_directory=persist_directory
#     )
#
# async def setup_embeddings(model="models/text-embedding-004"):
#     return GoogleGenerativeAIEmbeddings(
#         model=model,
#         google_api_key=settings.GOOGLE_API_KEY,
#     )


async def setup_groq_llm(
    model:str="openai/gpt-oss-20b",
    temperature:float=0.4,
    max_tokens:int=250
) -> ChatGroq:
    return ChatGroq(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=SecretStr(settings.GROQ_API_KEY),
    )


def setup_groq_llm_not_async(
    model:str="openai/gpt-oss-20b",
    temperature:float=0.4,
    max_tokens:int=2000
) -> ChatGroq:
    return ChatGroq(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=SecretStr(settings.GROQ_API_KEY),
    )



async def setup_gemini_llm(
    model:str="gemini-3-flash-preview",
    temperature:float=0.4,
    max_tokens:int=250
) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=settings.GOOGLE_API_KEY,
    )

def setup_non_async_gemini_llm(
    model:str="gemini-2.5-flash",
    temperature:float=0.4,
    max_tokens:int=2000
) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=settings.GOOGLE_API_KEY,
    )

