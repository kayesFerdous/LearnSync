from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from pydantic.config import ConfigDict

class SignupRequest(BaseModel):
    username: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72, description="Password must be between 8 and 72 characters")

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user_id: UUID
    message: str = "Authentication successful"


