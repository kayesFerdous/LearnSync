from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, status, HTTPException, Request

from src.users.model import User
from src.db.session import get_db
from src.core.config import settings
from src.users.crud import get_user_by_id
from src.auth.service import AuthError, decode_access_token
from src.calendar.google_client import GoogleCalendarClient
from src.core.integrations.google.auth_utils import get_google_calendar_service


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


async def get_calendar_client(
    user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
) -> GoogleCalendarClient:
    """
    Dependency to get an authenticated GoogleCalendarClient for the current user.
    """

    service = await get_google_calendar_service(str(user.user_id), db)

    if not service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have a connected Google Calendar or tokens are expired."
        )

    return GoogleCalendarClient(service)
