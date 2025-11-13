from pydantic import BaseModel
from typing import Literal


class QuestionRequest(BaseModel):
    question: str

class ToolSelection(BaseModel):
    tool: Literal["chat_node", "calendar_agent"]
