from datetime import datetime
from uuid import UUID
from typing import Annotated
from pydantic import BaseModel, EmailStr, AfterValidator, Field
from email_validator import validate_email as _validate_email
from disposable_email_domains import blocklist


def _check_email_domain(email: str) -> str:
    """Block disposable/temporary email domains."""
    email_info = _validate_email(email, check_deliverability=True)

    if email_info.domain in blocklist:
        raise ValueError("Disposable email domains are not allowed")

    return email_info.normalized


ValidEmail = Annotated[EmailStr, AfterValidator(_check_email_domain)]


class SignupRequest(BaseModel):
    username: str = Field(..., max_length=150)
    email: ValidEmail
    password: str = Field(..., min_length=8, max_length=72)

class LoginRequest(BaseModel):
    email: ValidEmail
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    user_id: UUID
    message: str = "Authentication successful"


