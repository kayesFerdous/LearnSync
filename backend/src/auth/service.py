"""
Authentication Service

This module provides functions for JSON Web Token (JWT) creation, decoding,
and a FastAPI dependency for securing routes.
"""
import logging
import bcrypt
from datetime import datetime, timedelta, timezone
from authlib.jose import JoseError, jwt

from src.core.config import settings

log = logging.getLogger(__name__)

# --- Password Hashing ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a bcrypt hash."""
    if not plain_password or not hashed_password:
        return False
    # bcrypt.checkpw expects bytes
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Generates a bcrypt hash from a plain text password."""
    # bcrypt.hashpw expects bytes and returns bytes
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


# --- Constants ---
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
ALGORITHM = settings.ALGORITHM
JWT_HEADER = {"alg": ALGORITHM}


class AuthError(Exception):
    """Custom exception for authentication-related errors.

    Not an AppException subclass because it is caught and re-raised
    as HTTPException in the API dependency layer (with WWW-Authenticate header).
    """
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


async def decode_access_token(token: str) -> str:
    """
    Verifies and decodes a JWT, returning the user ID from its payload.
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
