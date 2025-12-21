from langchain.hub import pull
from langchain.agents.agent import AgentExecutor
from langchain_core.language_models.chat_models import BaseChatModel
from langchain.agents.tool_calling_agent.base import create_tool_calling_agent

from src.agents.tools.google_calendar import create_google_calendar_tools


def build_calendar_agent(llm: BaseChatModel):
    tools = create_google_calendar_tools()
    prompt = pull("hwchase17/openai-functions-agent")
    agent = create_tool_calling_agent(llm,tools, prompt)

    return AgentExecutor(agent=agent, tools=tools)

