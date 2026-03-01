"""
Domain-level authentication DTOs.

These are used by the service layer and should NOT depend on the API layer.
The API layer (src/api/auth/schemas.py) defines request/response models
that may add extra validation (e.g., disposable email blocking).
"""
from pydantic import BaseModel, EmailStr, Field


class SignupData(BaseModel):
    """Domain DTO for user signup — used by the service layer."""
    username: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)


class LoginData(BaseModel):
    """Domain DTO for user login — used by the service layer."""
    email: EmailStr
    password: str
