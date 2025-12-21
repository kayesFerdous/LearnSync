import aiosqlite
from langchain_core.language_models.chat_models import BaseChatModel
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.constants import END, START
from langgraph.graph.state import StateGraph

from src.agents.model import AgentState
from src.agents.nodes.calendar_node import make_calendar_node
from src.agents.nodes.tool_selection_node import make_tool_selection_node
from src.agents.nodes.chat_node import make_chat_node
from src.agents.registry import build_calendar_agent


async def build_chat_graph(groq_llm: BaseChatModel, gemini_llm: BaseChatModel):
    graph = StateGraph(AgentState)

    calendar_executor = build_calendar_agent(gemini_llm)
    
    chat_node = make_chat_node(gemini_llm)
    calendar_node = make_calendar_node(calendar_executor)
    tool_selection_node = make_tool_selection_node()

    graph.add_node("chat_node", chat_node)
    graph.add_node("calendar_node", calendar_node)
    graph.add_node("tool_selection", tool_selection_node)

    graph.add_edge(START, "tool_selection")
    graph.add_conditional_edges(
        "tool_selection",
        lambda state: state["tool"],
    )
    graph.add_edge("chat_node", END)
    graph.add_edge("calendar_node", END)

    conn = await aiosqlite.connect("chat.sqlite")

    return graph.compile(checkpointer=AsyncSqliteSaver(conn=conn))
