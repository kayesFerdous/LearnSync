from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, status, HTTPException, Request, WebSocket

from src.users.model import User
from src.db.session import get_db
from src.core.config import settings
from src.users.repository import get_user_by_id
from src.auth.service import AuthError, decode_access_token
from src.calendar.google_client import GoogleCalendarClient
from src.core.integrations.google.auth_utils import get_google_calendar_service


async def get_current_user(
    request: Request, 
    db: AsyncSession = Depends(get_db)
) -> User | None:
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
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return user
    except AuthError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_ws(
    websocket: WebSocket,
    db: AsyncSession,
) -> User:
    """
    Authenticate a WebSocket connection via cookie or query-param token.
    Raises HTTPException(401) on failure — the caller should catch and
    close the socket with WS_1008_POLICY_VIOLATION.
    """
    token = websocket.cookies.get(settings.COOKIE_NAME)
    if not token:
        token = websocket.query_params.get("token")

    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        user_id = await decode_access_token(token)
        user = await get_user_by_id(user_id, db)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except AuthError:
        raise HTTPException(status_code=401, detail="Unauthorized")


async def is_admin(user:User =  Depends(get_current_user)) -> User:
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
