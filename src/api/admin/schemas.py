from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from pydantic import ConfigDict


class UserRead(BaseModel):
    """Schema for reading user data (includes ID and metadata)."""
    user_id: UUID
    username: str
    email: str
    picture: str | None = None
    is_admin: bool
    subscribed: bool
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UsersListResponse(BaseModel):
    """Response for listing users."""
    users: list[UserRead]
    total: int
    skip: int
    limit: int


class UserDeleteRequest(BaseModel):
    """Request to delete a user."""
    user_id: str


class UserDeleteResponse(BaseModel):
    """Response after deleting a user."""
    message: str
    user_id: str
