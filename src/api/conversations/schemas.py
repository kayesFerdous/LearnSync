from datetime import datetime
from typing import Literal, List
from pydantic import BaseModel, ConfigDict
from uuid import UUID


class ConversationRequest(BaseModel):
    message: str | None = None
    image: str | None = None
    user_input: str | dict | None  = None
    tag: str


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class FolderCreate(BaseModel):
    name: str
    icon: str | None = None
    color: str | None = None


class FolderResponse(BaseModel):
    id: UUID
    name: str
    icon: str | None = None
    color: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FolderWithConversations(FolderResponse):
    conversations: List[ConversationResponse] = []


class ConversationListResponse(BaseModel):
    folders: List[FolderWithConversations]
    conversations: List[ConversationResponse]


class ToolSelection(BaseModel):
    tool: Literal["chat_node", "calendar_agent"]
