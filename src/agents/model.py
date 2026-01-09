from typing import Annotated, List, Literal, Optional, TypedDict
from langchain_core.messages.base import BaseMessage

def chat_reducer(old: list[BaseMessage], new: list[BaseMessage]) -> list[BaseMessage]:
    return old[-6:] + new

AgentName = Literal["chat_node", "calendar_node", "routine_node"]

class AgentState(TypedDict):
    user_id: str
    conversation_id: str
    messages: Annotated[List[BaseMessage], chat_reducer]
    scratchpad: dict
    next_agent: Optional[AgentName]
    metadata: dict
    tag: str
