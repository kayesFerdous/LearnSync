from typing import Annotated, List, Literal, Optional, TypedDict
from langchain_core.messages.base import BaseMessage

def chat_reducer(old: list[BaseMessage], new: list[BaseMessage]) -> list[BaseMessage]:
    if new and new[0].additional_kwargs.get("replace_history"):
        return new
    return old[-6:] + new

AgentName = Literal["chat_node", "calendar_node", "routine_node", "rag_node"]

class AgentState(TypedDict):
    user_id: str
    messages: Annotated[List[BaseMessage], chat_reducer]
    scratchpad: dict
    next_agent: Optional[AgentName]
    metadata: dict
    tag: str
    tool: Optional[str]
