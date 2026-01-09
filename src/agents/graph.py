import aiosqlite
from langchain_core.language_models.chat_models import BaseChatModel
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.constants import END, START
from langgraph.graph.state import StateGraph

from src.agents.model import AgentState
from src.agents.nodes.calendar_node import make_calendar_node
from src.agents.nodes.tool_selection_node import make_tool_selection_node
from src.agents.nodes.chat_node import make_chat_node
from src.agents.nodes.routine_node import make_routine_node
from src.agents.nodes.routine_approval_node import make_routine_approval_node

async def build_graph(groq_llm: BaseChatModel, gemini_llm: BaseChatModel, gemini_llm_temp_0: BaseChatModel):
    graph = StateGraph(AgentState)
    
    chat_node = make_chat_node(groq_llm)
    calendar_node = make_calendar_node(gemini_llm) 
    tool_selection_node = make_tool_selection_node()
    routine_node = make_routine_node(gemini_llm_temp_0)
    routine_approval_node = make_routine_approval_node()

    graph.add_node("chat_node", chat_node)
    graph.add_node("calendar_node", calendar_node)
    graph.add_node("tool_selection", tool_selection_node)
    graph.add_node("routine_node", routine_node)
    graph.add_node("routine_approval_node", routine_approval_node)

    graph.add_edge(START, "tool_selection")
    graph.add_conditional_edges(
        "tool_selection",
        lambda state: state["tool"],
    )
    graph.add_edge("chat_node", END)
    graph.add_edge("calendar_node", END)
    graph.add_edge("routine_node", "routine_approval_node")
    graph.add_edge("routine_approval_node", END)

    conn = await aiosqlite.connect("chat.sqlite")

    return graph.compile(checkpointer=AsyncSqliteSaver(conn=conn))
