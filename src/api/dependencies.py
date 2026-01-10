from fastapi import Depends, status, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import get_db
from src.auth.service import AuthError, decode_access_token
from src.users.crud import get_user_by_id
from src.core.config import settings
from src.users.model import User


async def get_current_user(
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    """
    Dependency to secure a route by verifying the JWT from a cookie.
    """
    token = request.cookies.get(settings.COOKIE_NAME)

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication cookie not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = await decode_access_token(token)
        user = await get_user_by_id(user_id, db)
        return user
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def is_admin(user:User =  Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
