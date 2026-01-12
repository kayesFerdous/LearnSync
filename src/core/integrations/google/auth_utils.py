from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy.ext.asyncio.session import AsyncSession
from src.users.crud import get_user_identity
from src.core.config import settings

async def get_google_calendar_service(user_id: str, db: AsyncSession):
    identity = await get_user_identity(user_id, db)
        
    if not identity:
        print(f"No identity found for user {user_id}")
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
        print(f"Error creating google calendar service: {e}")
        return None
