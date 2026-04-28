from langchain.agents.agent import AgentExecutor
from langchain_core.language_models.chat_models import BaseChatModel
from langchain.agents.tool_calling_agent.base import create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy.ext.asyncio.session import AsyncSession

from src.core.integrations.google.calendar_service import get_users_calendar_tools

async def build_calendar_agent(user_id: str, llm: BaseChatModel, db: AsyncSession):
    # Retrieve tools AND timezone
    tools, timezone = await get_users_calendar_tools(user_id, db)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful and efficient Google Calendar assistant."),
        ("system", "CRITICAL: When invoking tools, you MUST provide arguments as valid JSON. keys and string values must be enclosed in DOUBLE QUOTES (\"). Do NOT use single quotes (')."),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    
    agent = create_tool_calling_agent(llm, tools, prompt)

    return AgentExecutor(agent=agent, tools=tools, verbose=True), timezone

