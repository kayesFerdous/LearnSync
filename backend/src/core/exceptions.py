"""
Centralized application exceptions and FastAPI exception handlers.

All domain-specific exceptions inherit from AppException, which carries
an HTTP status code, a machine-readable error code, and a human-readable
detail message.  A single FastAPI exception handler translates these into
a consistent JSON error envelope:

    {"detail": "...", "code": "..."}
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


# ---------------------------------------------------------------------------
# Base exception
# ---------------------------------------------------------------------------

class AppException(Exception):
    """Base exception for all application-level errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "INTERNAL_ERROR"
    detail: str = "An unexpected error occurred"

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.__class__.detail
        super().__init__(self.detail)


# ---------------------------------------------------------------------------
# Auth / credentials
# ---------------------------------------------------------------------------

class InvalidCredentialsException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "INVALID_CREDENTIALS"
    detail = "Invalid email or password"


class EmptyTokenException(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "EMPTY_TOKEN"
    detail = "Authentication token is missing"


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserAlreadyExistsException(AppException):
    status_code = status.HTTP_409_CONFLICT
    code = "USER_ALREADY_EXISTS"
    detail = "A user with this email already exists"


class NotFoundException(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    code = "NOT_FOUND"
    detail = "Resource not found"


class ForbiddenException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    code = "FORBIDDEN"
    detail = "You do not have permission to perform this action"


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

class EmailNotVerifiedException(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    code = "EMAIL_NOT_VERIFIED"
    detail = "Please verify your email before logging in"


class EmailVerificationTokenInvalidException(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "EMAIL_TOKEN_INVALID"
    detail = "The verification link is invalid or has already been used"


class EmailVerificationTokenExpiredException(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "EMAIL_TOKEN_EXPIRED"
    detail = "The verification link has expired"


class EmailVerificationResendTooSoonException(AppException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "EMAIL_RESEND_TOO_SOON"
    detail = "Please wait before requesting a new verification email"


class EmailVerificationDeliveryException(AppException):
    status_code = status.HTTP_502_BAD_GATEWAY
    code = "EMAIL_DELIVERY_FAILED"
    detail = "Failed to send verification email"


# ---------------------------------------------------------------------------
# FastAPI exception handler registration
# ---------------------------------------------------------------------------

def register_exception_handlers(app: FastAPI) -> None:
    """Register a global handler that converts any AppException into JSON."""

    @app.exception_handler(AppException)
    async def _app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
        )
