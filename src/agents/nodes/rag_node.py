from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.language_models.chat_models import BaseChatModel

from src.agents.model import AgentState


def make_rag_node(llm: BaseChatModel):
    async def rag_node(state: AgentState):
        pass #TODO: yet to implement

    return rag_node
