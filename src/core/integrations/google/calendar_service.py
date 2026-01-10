import json
import re
from typing import Optional, Type, Any
from pydantic import BaseModel, Field
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from langchain_google_community import CalendarToolkit
from langchain_google_community.calendar.search_events import CalendarSearchEvents, SearchEventsSchema
from langchain_google_community.calendar.get_calendars_info import GetCalendarsInfo

from src.users.crud import get_user_identity
from src.db.session import AsyncSessionLocal
from src.core.config import settings

def sanitize_json_string(s: str) -> str:
    """Removes or escapes control characters that break JSON parsing."""
    if not s:
        return s
    # Replace literal newlines, carriage returns, and tabs with spaces
    return re.sub(r'[\n\r\t]', ' ', s)

class SafeGetCalendarsInfo(GetCalendarsInfo):
    name: str = "get_calendars_info"
    description: str = "Use this tool to get information about the calendars in Google Calendar."

    def _run(self, run_manager: Optional[Any] = None) -> str:
        try:
            calendars = self.api_resource.calendarList().list().execute()
            data = []
            for item in calendars.get("items", []):
                data.append({
                    "id": item["id"],
                    "summary": sanitize_json_string(item.get("summary", "")),
                    "timeZone": item.get("timeZone", "UTC"),
                })
            return json.dumps(data)
        except Exception as error:
            raise Exception(f"An error occurred in SafeGetCalendarsInfo: {error}")

class SafeSearchEventsSchema(SearchEventsSchema):
    calendars_info: Optional[str] = Field(
        default=None,
        description="Information about calendars. If not provided, it will be fetched automatically."
    )

class SafeCalendarSearchEvents(CalendarSearchEvents):
    args_schema: Type[BaseModel] = SafeSearchEventsSchema

    def _run(self, calendars_info: Optional[str] = None, **kwargs: Any) -> Any:
        # If the LLM didn't provide it, or if it's broken, we fetch it ourselves
        if not calendars_info:
            try:
                calendars = self.api_resource.calendarList().list().execute()
                data = []
                for item in calendars.get("items", []):
                    data.append({
                        "id": item["id"],
                        "summary": sanitize_json_string(item.get("summary", "")),
                        "timeZone": item.get("timeZone", "UTC"),
                    })
                calendars_info = json.dumps(data)
            except Exception as e:
                print(f"Warning: Failed to fetch calendars_info internally: {e}")
                # We can't proceed without calendar IDs
                raise Exception("Missing calendars_info and failed to fetch it internally.")
        
        # Sanitize the input string in case the LLM passed literal control characters
        sanitized_info = sanitize_json_string(calendars_info)
        return super()._run(calendars_info=sanitized_info, **kwargs)



async def get_users_calendar_tools(user_id: str):
    async with AsyncSessionLocal() as db:
        identity = await get_user_identity(user_id, db)
        
    if not identity:
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
        
        raw_tools = toolkit.get_tools()
        final_tools = []
        
        for tool in raw_tools:
            if tool.name == "get_calendars_info":
                final_tools.append(SafeGetCalendarsInfo(api_resource=service))
            elif tool.name == "search_events":
                final_tools.append(SafeCalendarSearchEvents(api_resource=service))
            elif tool.name != "get_current_datetime":
                final_tools.append(tool)
        
        return final_tools
        
    except Exception as e:
        print(f"Error creating user tools: {e}")
        return []
