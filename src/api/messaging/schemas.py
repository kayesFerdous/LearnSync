from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: UUID

class MessageResponse(MessageBase):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    created_at: datetime
    read_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

class ChatHistoryResponse(BaseModel):
    messages: list[MessageResponse]
    total_count: int

class ContactResponse(BaseModel):
    user_id: UUID
    username: str
    email: str | None = None
    picture: str | None = None
    last_message: MessageResponse | None = None
    unread_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)
