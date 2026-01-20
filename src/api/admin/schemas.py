from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class UserRead(BaseModel):
    """Schema for reading user data (includes ID and metadata)."""
    user_id: UUID
    username: str
    email: str
    is_admin: bool
    subscribed: bool
    created_at: datetime
    updated_at: datetime | None = None

class UserDeleteRequest(BaseModel):
    user_id: str
