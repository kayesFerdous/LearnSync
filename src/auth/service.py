"""
Authentication Service

This module provides functions for JSON Web Token (JWT) creation, decoding,
and a FastAPI dependency for securing routes.
"""
import logging
from datetime import datetime, timedelta, timezone

from authlib.jose import JoseError, jwt
from fastapi import HTTPException, Request, status

from src.core.config import settings

log = logging.getLogger(__name__)

# --- Constants ---
# JWT settings should be centralized in the main config.
# Using `getattr` provides a sensible fallback if they are not defined.
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
ALGORITHM = "HS256"
JWT_HEADER = {"alg": ALGORITHM}


class AuthError(Exception):
    """Custom exception for authentication-related errors."""
    pass


async def create_access_token(user_id: str) -> str:
    """
    Generates a JWT access token for a given user.

    Args:
        user_id: The unique identifier for the user (subject of the token).

    Returns:
        A signed JWT access token as a string.
    
    Raises:
        AuthError: If the token creation process fails.
    """
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),  # Standard claim for the subject ID
        "exp": expires,       # Standard claim for expiration time
        "iat": now,           # Standard claim for time the token was issued
    }

    try:
        token = jwt.encode(header=JWT_HEADER, payload=payload, key=settings.JWT_SECRET_KEY)
        return token.decode("utf-8")
    except Exception as e:
        log.error(f"Failed to encode JWT: {e}", exc_info=True)
        raise AuthError("Could not create access token due to an internal error.")


def decode_access_token(token: str) -> str:
    """
    Verifies and decodes a JWT, returning the user ID from its payload.

    Args:
        token: The JWT string to decode.

    Raises:
        AuthError: If the token is invalid, expired, malformed, or missing the user ID.

    Returns:
        The user ID (`sub` claim) extracted from the token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY)
        user_id = payload.get("sub")

        if user_id is None:
            # A token without a subject is considered invalid for our use case.
            raise AuthError("Token is missing the required 'sub' (user ID) claim.")
        
        return user_id

    except JoseError as e:
        # `JoseError` is the base exception for authlib's JWT/JWS/JWE errors,
        # including signature, format, and expiration errors.
        log.warning(f"JWT validation failed: {e}")
        raise AuthError("Invalid or expired token.")
    except Exception as e:
        log.error(f"An unexpected error occurred during token decoding: {e}", exc_info=True)
        raise AuthError("Could not process token due to an internal error.")


async def get_current_user(request: Request) -> str:
    """
    FastAPI dependency to secure a route by verifying the JWT from a cookie.

    It extracts the token, decodes it, and returns the user ID. If any step
    fails, it raises a 401 Unauthorized HTTP exception.

    Raises:
        HTTPException(401): If the token is missing, invalid, or expired.

    Returns:
        The authenticated user's ID, which can be used in the endpoint.
    """
    token = request.cookies.get(settings.COOKIE_NAME)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication cookie not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = decode_access_token(token)
        return user_id
    except AuthError as e:
        # Translate the internal AuthError into a standard HTTP 401 response.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
