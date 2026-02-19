from typing import Literal, Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: Optional[str] = None
    image: Optional[str] = None
    user_input: Optional[dict|str] = None
    tag: str | None = None  # Made optional for auto-routing

class ToolSelection(BaseModel):
    tool: Literal["chat_node", "calendar_agent"]
