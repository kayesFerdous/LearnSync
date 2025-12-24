from typing import Literal, Optional
from pydantic import BaseModel


class QuestionRequest(BaseModel):
    message: Optional[str] = None
    image: Optional[str] = None
    user_input: Optional[dict|str] = None
    tag: str

class ToolSelection(BaseModel):
    tool: Literal["chat_node", "calendar_agent"]
