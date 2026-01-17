from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class UserSettings(BaseModel):
    timezone: str
    theme: str | None = None

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str
    email: str
    picture: str | None = Field(None, description="User's profile picture URL")

class UserResponse(UserBase):
    user_id: UUID
    is_admin: bool
    subscribed: bool
    created_at: datetime
    settings: UserSettings | None = None

    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    username: str | None = None
    picture: str | None = None


class UserIdentityResponse(BaseModel):
    id: UUID
    provider: str
    external_sub: str
    expires_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

