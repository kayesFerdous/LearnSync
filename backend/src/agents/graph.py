from langchain_core.language_models.chat_models import BaseChatModel
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.constants import END, START
from langgraph.graph.state import StateGraph

from src.agents.model import AgentState
from src.agents.nodes.calendar_node import make_calendar_node
from src.agents.nodes.route_intent_node import make_route_intent_node
from src.agents.nodes.chat_node import make_chat_node
from src.agents.nodes.routine_node import make_routine_node
from src.agents.nodes.routine_approval_node import make_routine_approval_node
from src.agents.nodes.rag_node import make_rag_node

async def build_graph(
    groq_llm: BaseChatModel, 
    gemini_llm: BaseChatModel, 
    gemini_llm_temp_0: BaseChatModel,
    route_intent_llm,
    checkpointer: AsyncPostgresSaver
):
    graph = StateGraph(AgentState)
    
    chat_node = make_chat_node(groq_llm)
    calendar_node = make_calendar_node(gemini_llm) 
    route_intent_node = make_route_intent_node(route_intent_llm)
    routine_node = make_routine_node(gemini_llm_temp_0)
    routine_approval_node = make_routine_approval_node()
    rag_node = make_rag_node(gemini_llm, groq_llm)

    graph.add_node("chat_node", chat_node)
    graph.add_node("calendar_node", calendar_node)
    graph.add_node("route_intent", route_intent_node)
    graph.add_node("routine_node", routine_node)
    graph.add_node("routine_approval_node", routine_approval_node)
    graph.add_node("rag_node", rag_node)

    graph.add_edge(START, "route_intent")
    graph.add_conditional_edges(
        "route_intent",
        lambda state: state["tool"],
    )
    graph.add_edge("chat_node", END)
    graph.add_edge("calendar_node", END)
    graph.add_edge("routine_node", "routine_approval_node")
    graph.add_edge("routine_approval_node", END)
    graph.add_edge("rag_node", END)

    return graph.compile(checkpointer=checkpointer)
