from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict
from uuid import UUID


class ConversationRequest(BaseModel):
    message: str | None = None
    image: str | None = None
    user_input: str | None  = None
    tag: str


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)



class ToolSelection(BaseModel):
    tool: Literal["chat_node", "calendar_agent"]
