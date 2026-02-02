from uuid import UUID
from typing import Optional, List
from datetime import datetime, timedelta
import base64
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from langchain_core.messages import HumanMessage
from langchain_core.language_models.chat_models import BaseChatModel

from src.routines import crud, schemas
from src.core.integrations.google.auth_utils import get_service_and_timezone
from src.core.integrations.google.calendar_service import (
    sync_db_routine_to_google, 
    delete_google_events_for_routine,
    get_next_weekday_date
)
from src.routines.models import Routine, ClassSession
from src.calendar.google_client import GoogleCalendarClient
from src.calendar.schemas import EventUpdate, CalendarTime
from src.services.vision.extractor import image_extractor
from src.services.vision.schema import WeeklyRoutine, ApprovedWeeklyRoutine


async def extract_routine_from_image(
    llm: BaseChatModel,
    file_contents: bytes,
    content_type: str
) -> WeeklyRoutine:
    """
    Extracts a weekly routine from an image using the provided LLM.
    """
    encoded_image = base64.b64encode(file_contents).decode("utf-8")
    
    msg = HumanMessage(
        content=[
            {"type": "text", "text": "Analyze this image. It is a routine. Extract the routine details strictly into the requested JSON format."},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{content_type};base64,{encoded_image}"},
            },
        ]
    )
    
    return await image_extractor(llm, msg)


async def confirm_routine_from_vision(
    db: AsyncSession, 
    user_id: UUID, 
    routine_data: ApprovedWeeklyRoutine
) -> Routine:
    """
    Converts the vision-specific schema to the internal DB schema,
    and creates/replaces the routine.
    """
    classes_create = []
    for cls in routine_data.classes:
        # TimeFormat.dateTime is Optional[datetime].
        # We skip entries without valid start/end times.
        if not cls.start.dateTime or not cls.end.dateTime:
            continue
            
        classes_create.append(
            schemas.ClassSessionCreate(
                day=cls.day,
                start_time=cls.start.dateTime,
                end_time=cls.end.dateTime,
                course_name=cls.course_name,
                recurrence=cls.recurrence
            )
        )

    internal_routine_data = schemas.RoutineCreate(
        title=routine_data.title,
        classes=classes_create
    )

    return await create_or_replace_routine(db, user_id, internal_routine_data)


async def get_my_routine(db: AsyncSession, user_id: UUID) -> Optional[Routine]:
    return await crud.get_user_routine(db, user_id)

async def _localize_session_times(session_data, timezone_str: str):
    """
    Helper to localize naive datetimes in session data to the user's timezone.
    Accepts schemas.ClassSessionCreate or ClassSessionUpdate.
    """
    try:
        user_tz = ZoneInfo(timezone_str)
    except Exception:
        user_tz = ZoneInfo("UTC")

    if session_data.start_time and session_data.start_time.tzinfo is None:
        session_data.start_time = session_data.start_time.replace(tzinfo=user_tz)
    
    if session_data.end_time and session_data.end_time.tzinfo is None:
        session_data.end_time = session_data.end_time.replace(tzinfo=user_tz)


async def create_or_replace_routine(db: AsyncSession, user_id: UUID, routine_data: schemas.RoutineCreate) -> Routine:
    # 1. Check for existing routine
    existing_routine = await crud.get_user_routine(db, user_id)
    
    # 2. Get Google Service
    service, timezone = await get_service_and_timezone(str(user_id), db)
    
    # 2.5 Localize naive datetimes
    for cls in routine_data.classes:
        await _localize_session_times(cls, timezone)

    # 3. Clean up old routine (DB + Google)
    if existing_routine:
        if service:
            await delete_google_events_for_routine(service, existing_routine)
        
        # We delete the old routine from DB
        await crud.delete_routine_object(db, existing_routine)

    # 4. Create new routine in DB
    new_routine = await crud.create_routine_db(db, user_id, routine_data)
    
    # 5. Sync to Google Calendar
    if service:
        # We need to refresh/load classes to sync them
        # create_routine_db should return routine with classes loaded
        await sync_db_routine_to_google(service, new_routine, new_routine.classes, timezone, db)
        # Refresh to get updated google_event_ids saved by sync function
        await db.refresh(new_routine, attribute_names=["classes"])

    return new_routine

async def delete_my_routine(db: AsyncSession, user_id: UUID):
    routine = await crud.get_user_routine(db, user_id)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
        
    # Sync: Delete events
    service, _ = await get_service_and_timezone(str(user_id), db)
    if service:
        await delete_google_events_for_routine(service, routine)
        
    await crud.delete_routine_object(db, routine)

async def add_class_session(db: AsyncSession, user_id: UUID, class_data: schemas.ClassSessionCreate) -> ClassSession:
    routine = await crud.get_user_routine(db, user_id)
    if not routine:
         raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Routine not found. Please create a routine first."
        )
    
    # Get user timezone settings
    service, timezone = await get_service_and_timezone(str(user_id), db)

    # Auto-generate recurrence if missing
    if not class_data.recurrence:
        rrule_days = {
            "monday": "MO", "tuesday": "TU", "wednesday": "WE", "thursday": "TH",
            "friday": "FR", "saturday": "SA", "sunday": "SU"
        }
        day_code = rrule_days.get(class_data.day.lower())
        if day_code:
            class_data.recurrence = [f"RRULE:FREQ=WEEKLY;BYDAY={day_code}"]

    # Localize naive datetimes
    await _localize_session_times(class_data, timezone)

    new_class = await crud.add_class_to_routine_db(db, routine.id, class_data)
    
    # Sync: Add single event
    if service:
        await sync_db_routine_to_google(service, routine, [new_class], timezone, db)
        await db.refresh(new_class)
        
    return new_class


async def remove_class_session(db: AsyncSession, user_id: UUID, class_id: UUID):
    class_session = await crud.get_class_session(db, user_id, class_id)
    if not class_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class session not found")
    
    # Sync: Delete single event
    if class_session.google_event_id:
        service, _ = await get_service_and_timezone(str(user_id), db)
        if service:
            client = GoogleCalendarClient(service)
            try:
                await client.delete_event(class_session.google_event_id)
            except Exception:
                pass # Ignore if not found or already deleted

    await crud.delete_class_session_db(db, class_session)


async def update_class_session(db: AsyncSession, user_id: UUID, class_id: UUID, update_data: schemas.ClassSessionUpdate) -> ClassSession:
    class_session = await crud.get_class_session(db, user_id, class_id)
    if not class_session:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class session not found")
    
    # Get user timezone settings for localization
    service, timezone = await get_service_and_timezone(str(user_id), db)
    
    rrule_days = {
        "monday": "MO", "tuesday": "TU", "wednesday": "WE", "thursday": "TH",
        "friday": "FR", "saturday": "SA", "sunday": "SU"
    }
    day_code = rrule_days.get(update_data.day.lower()) #type: ignore
    if day_code:
        update_data.recurrence = [f"RRULE:FREQ=WEEKLY;BYDAY={day_code}"]
    # Localize naive datetimes
    await _localize_session_times(update_data, timezone)
         
    updated_class = await crud.update_class_session_db(db, class_session, update_data)
    
    # Sync: Update event (if exists)
    if updated_class.google_event_id and service:
        client = GoogleCalendarClient(service)
        try:
            # Ensure updated_class times are timezone-aware (DB assumes UTC if naive)
            await _localize_session_times(updated_class, "UTC")
            
            # Calculate new start/end times for the event
            start_date = get_next_weekday_date(updated_class.day, timezone)
            
            try:
                tz = ZoneInfo(timezone)
            except Exception:
                tz = ZoneInfo("UTC")

            start_time = updated_class.start_time.astimezone(tz).time() #type: ignore
            end_time = updated_class.end_time.astimezone(tz).time() #type: ignore
            
            dt_start_naive = datetime.combine(start_date.date(), start_time)
            dt_end_naive = datetime.combine(start_date.date(), end_time)
            
            dt_start = dt_start_naive.replace(tzinfo=tz)
            dt_end = dt_end_naive.replace(tzinfo=tz)
            
            if dt_end < dt_start:
                dt_end += timedelta(days=1)
            
            event_update = EventUpdate(
                summary=updated_class.course_name,
                start=CalendarTime(dateTime=dt_start, timeZone=timezone),
                end=CalendarTime(dateTime=dt_end, timeZone=timezone),
                recurrence=updated_class.recurrence
            )
            
            await client.patch_event(updated_class.google_event_id, event_update)
            
        except Exception as e:
            # We log the error but do not fail the request
            print(f"Failed to update Google Calendar event: {e}")
             
    return updated_class
