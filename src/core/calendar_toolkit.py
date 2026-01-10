from datetime import datetime
from zoneinfo import ZoneInfo

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from langchain_google_community import CalendarToolkit

from src.users.crud import get_user_identity
from src.db.session import AsyncSessionLocal
from src.core.config import settings


async def get_user_tools(user_id: str):
    async with AsyncSessionLocal() as db:
        identity = await get_user_identity(user_id, db)
        
    if not identity:
        # Fallback or error. For now, let's log and return empty or raise.
        print(f"No identity found for user {user_id}")
        return []

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
        toolkit = CalendarToolkit(api_resource=service)
        return toolkit.get_tools()
    except Exception as e:
        print(f"Error creating user tools: {e}")
        return []




async def get_current_time_context(timezone: str = "Asia/Dhaka"):
    """Returns a clear time context string.""" 
    try: 
        tz = ZoneInfo(timezone)
        now = datetime.now(tz)
        date_time = now.strftime("%A, %Y-%m-%d %H:%M:%S")
        return f"Time zone: {timezone}, Current Date and Time: {date_time}"
    except Exception:
        now = datetime.now(ZoneInfo("UTC"))
        return f"Current Date: {now.strftime('%Y-%m-%d')} (UTC)"


