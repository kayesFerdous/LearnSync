import re
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Optional, Type, Any, List
from pydantic import BaseModel, Field
from langchain_google_community import CalendarToolkit
from langchain_google_community.calendar.search_events import CalendarSearchEvents, SearchEventsSchema
from langchain_google_community.calendar.get_calendars_info import GetCalendarsInfo
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import json

from src.core.integrations.google.auth_utils import get_service_and_timezone
from src.routines.models import Routine, ClassSession
from src.calendar.google_client import GoogleCalendarClient
from src.calendar.schemas import EventCreate, CalendarTime

logger = logging.getLogger(__name__) 

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
            calendars = self.api_resource.calendarList().list().execute() #type: ignore
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
    calendars_info: Optional[str] = Field( #type: ignore
        default=None,
        description="Information about calendars. If not provided, it will be fetched automatically."
    )

class SafeCalendarSearchEvents(CalendarSearchEvents):
    args_schema: Type[BaseModel] = SafeSearchEventsSchema #type: ignore

    def _run(self, calendars_info: Optional[str] = None, **kwargs: Any) -> Any: #type: ignore
        # If the LLM didn't provide it, or if it's broken, we fetch it ourselves
        if not calendars_info:
            try:
                calendars = self.api_resource.calendarList().list().execute()  #type: ignore
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


async def get_users_calendar_tools(user_id: str, db: AsyncSession):
    # Retrieve service AND timezone in one efficient query
    service, timezone = await get_service_and_timezone(user_id, db)
        
    if not service:
        return [], "UTC"

    try:
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
        
        return final_tools, timezone
        
    except Exception as e:
        print(f"Error creating user tools: {e}")
        return [], "UTC"


def get_next_weekday_date(day_name: str, timezone: str) -> datetime:
    """Calculates the date of the next occurrence (or today) of the given day."""
    try:
        tz = ZoneInfo(timezone)
    except Exception:
        tz = ZoneInfo("UTC") # Fallback
        
    now = datetime.now(tz)
    
    days_map = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    }
    
    target_day = days_map.get(day_name.lower())
    if target_day is None:
        # Fallback to today if day name is invalid, though validation should catch this
        return now

    current_day = now.weekday()
    days_ahead = (target_day - current_day) % 7
    
    return now + timedelta(days=days_ahead)


async def sync_db_routine_to_google(service, routine: Routine, classes: List[ClassSession], timezone: str, db: AsyncSession):
    """
    Adds all classes from the DB routine to Google Calendar and updates DB with Event IDs.
    """
    logger.info(f"Starting sync of routine '{routine.title}' to Google Calendar (TZ: {timezone})")
    
    client = GoogleCalendarClient(service)

    rrule_days = {
        "monday": "MO", "tuesday": "TU", "wednesday": "WE", "thursday": "TH",
        "friday": "FR", "saturday": "SA", "sunday": "SU"
    }

    # Prepare list of events to insert
    events_to_create: List[EventCreate] = []
    # Keep track of which class corresponds to which event for mapping IDs back
    class_mapping: List[ClassSession] = []

    for session in classes:
        if not session.start_time or not session.end_time:
            continue

        start_date = get_next_weekday_date(session.day, timezone)
        
        try:
            tz = ZoneInfo(timezone)
        except:
            tz = ZoneInfo("UTC")

        # Convert DB time (UTC) to User Timezone before extracting hour/minute
        # If DB returns naive, we assume it's UTC (standard for DateTime(timezone=True))
        
        s_time_aware = session.start_time
        if s_time_aware.tzinfo is None:
            s_time_aware = s_time_aware.replace(tzinfo=ZoneInfo("UTC"))
        
        e_time_aware = session.end_time
        if e_time_aware.tzinfo is None:
            e_time_aware = e_time_aware.replace(tzinfo=ZoneInfo("UTC"))
            
        start_time = s_time_aware.astimezone(tz).time()
        end_time = e_time_aware.astimezone(tz).time()
        
        dt_start_naive = datetime.combine(start_date.date(), start_time)
        dt_end_naive = datetime.combine(start_date.date(), end_time)
        
        dt_start = dt_start_naive.replace(tzinfo=tz)
        dt_end = dt_end_naive.replace(tzinfo=tz)
        
        if dt_end < dt_start:
            dt_end += timedelta(days=1)

        recurrence = session.recurrence
        if not recurrence:
            day_code = rrule_days.get(session.day.lower())
            if day_code:
                recurrence = [f"RRULE:FREQ=WEEKLY;BYDAY={day_code}"]
        
        event = EventCreate(
            summary=session.course_name,
            description=f"Part of routine: {routine.title}",
            start=CalendarTime(dateTime=dt_start, timeZone=timezone),
            end=CalendarTime(dateTime=dt_end, timeZone=timezone),
            recurrence=recurrence
        )
        events_to_create.append(event)
        class_mapping.append(session)

    if not events_to_create:
        return

    # Create events
    created_events = await client.batch_create_events(events_to_create)
    
    # Update DB with IDs
    for session, event in zip(class_mapping, created_events):
        if event and event.id:
            session.google_event_id = event.id
            
    await db.commit()


async def delete_google_events_for_routine(service, routine: Routine):
    """
    Deletes all Google Calendar events associated with the routine's classes.
    """
    client = GoogleCalendarClient(service)
    
    # Collect all event IDs
    event_ids = [cls.google_event_id for cls in routine.classes if cls.google_event_id]
    
    if not event_ids:
        return

    # Delete events using batch request to avoid rate limits and auth contention
    try:
        await client.batch_delete_events(event_ids)
    except Exception as e:
        logger.error(f"Failed to batch delete events for routine {routine.title}: {e}")

