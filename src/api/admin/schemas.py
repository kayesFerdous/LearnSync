from pydantic import BaseModel

from src.users.schemas import UserRead


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
