from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy.ext.asyncio.session import AsyncSession
import logging

from src.users.repository import get_user_identity, get_identity_and_timezone
from src.core.config import settings

logger = logging.getLogger(__name__)

async def get_google_calendar_service(user_id: str, db: AsyncSession):
    identity = await get_user_identity(user_id, db)
        
    if not identity:
        logger.warning(f"No identity found for user {user_id}")
        return None

    try:
        creds = Credentials(
            token=identity.access_token.strip() if identity.access_token else None,
            refresh_token=identity.refresh_token.strip() if identity.refresh_token else None,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=["https://www.googleapis.com/auth/calendar"]
        )

        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        return service
        
    except Exception as e:
        logger.error(f"Error creating google calendar service: {e}")
        return None

async def get_service_and_timezone(user_id: str, db: AsyncSession):
    """
    Returns (service, timezone).
    """
    identity, timezone = await get_identity_and_timezone(user_id, db)

    if not identity:
        logger.warning(f"No identity found for user {user_id}")
        return None, "UTC"

    try:
        creds = Credentials(
            token=identity.access_token.strip() if identity.access_token else None,
            refresh_token=identity.refresh_token.strip() if identity.refresh_token else None,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=["https://www.googleapis.com/auth/calendar"]
        )

        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        return service, timezone
        
    except Exception as e:
        logger.error(f"Error creating google calendar service: {e}")
        return None, "UTC"
