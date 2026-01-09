from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from langchain_google_community import CalendarToolkit

from src.users.crud import get_user_identity
from src.db.session import AsyncSessionLocal
from src.core.config import settings


async def get_users_calendar_tools(user_id: str):
    async with AsyncSessionLocal() as db:
        identity = await get_user_identity(user_id, db)
        
    if not identity:
        # Fallback or error. For now, let's log and return empty or raise.
        print(f"No identity found for user {user_id}")
        return []

    try:
        creds = Credentials(
            token=identity.access_token,
            refresh_token=identity.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=["https://www.googleapis.com/auth/calendar"]
        )

        service = build("calendar", "v3", credentials=creds)
        toolkit = CalendarToolkit(api_resource=service)
        return [tool for tool in toolkit.get_tools() if tool.name != "get_current_datetime"]
        
    except Exception as e:
        print(f"Error creating user tools: {e}")
        return []
