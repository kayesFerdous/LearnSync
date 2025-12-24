from langchain.hub import pull
from langchain.agents.agent import AgentExecutor
from langchain_core.language_models.chat_models import BaseChatModel
from langchain.agents.tool_calling_agent.base import create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from src.agents.tools.google_calendar import create_google_calendar_tools


def build_calendar_agent(llm: BaseChatModel):
    tools = create_google_calendar_tools()
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful and efficient Google Calendar assistant."),
        ("system", "CRITICAL: When invoking tools, you MUST provide arguments as valid JSON. keys and string values must be enclosed in DOUBLE QUOTES (\"). Do NOT use single quotes (')."),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])
    
    agent = create_tool_calling_agent(llm,tools, prompt)

    return AgentExecutor(agent=agent, tools=tools)

