from typing import Annotated, List, Literal, Optional, TypedDict
from dataclasses import dataclass, field
from langchain_core.messages.base import BaseMessage
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession


def chat_reducer(old: list[BaseMessage], new: list[BaseMessage]) -> list[BaseMessage]:
    if new and new[0].additional_kwargs.get("replace_history"):
        return new
    return old[-6:] + new

AgentName = Literal["chat_node", "calendar_node", "routine_node", "rag_node"]


class Route(BaseModel):
    """Structured output schema for the route-intent LLM."""
    tag: Literal["scheduler", "rag", "chatter"] = Field(
        ...,
        description="The classification tag for the user's input",
    )


@dataclass
class AgentContext:
    """
    Typed container for agent dependencies passed through LangGraph config.

    Centralises all external dependencies that agent nodes need, replacing
    loose ``config["configurable"]`` dict access.  Pass an instance via
    ``config["configurable"]["ctx"]`` when invoking the workflow.
    """
    db: AsyncSession


class AgentState(TypedDict):
    user_id: str
    messages: Annotated[List[BaseMessage], chat_reducer]
    scratchpad: dict
    next_agent: Optional[AgentName]
    metadata: dict
    tag: str | None  # Allow None for auto-routing
    tool: Optional[str]
