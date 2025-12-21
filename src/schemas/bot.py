from pydantic import BaseModel
from typing import Literal


class QuestionRequest(BaseModel):
    message: str
    tag: str

class ToolSelection(BaseModel):
    tool: Literal["chat_node", "calendar_agent"]
