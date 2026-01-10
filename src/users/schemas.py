from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- User Identity Schemas ---

class UserIdentityBase(BaseModel):
    provider: str = Field(..., max_length=50)
    external_sub: str = Field(..., max_length=255)


class UserIdentityCreate(UserIdentityBase):
    """Schema for creating a user identity (OAuth or Email)."""
    password_hash: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    expires_at: datetime | None = None


class UserIdentityRead(UserIdentityBase):
    pass

# ... (rest of the code)
class UserBase(BaseModel):
    username: str = Field(..., max_length=150)
    email: EmailStr
    picture: str | None = Field(None, max_length=150)


class UserCreate(UserBase, UserIdentityCreate):
    """Schema for creating a new user with an initial identity."""
    pass


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""
    username: str | None = Field(None, max_length=150)
    picture: str | None = Field(None, max_length=150)
    subscribed: bool | None = None


class UserRead(UserBase):
    """Schema for reading user data (includes ID and metadata)."""
    user_id: UUID
    is_admin: bool
    subscribed: bool
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserWithIdentity(UserRead):
    """Comprehensive schema including identity information."""
    identity: UserIdentityRead | None = None
