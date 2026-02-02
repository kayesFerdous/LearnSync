from uuid import UUID
from typing import Optional, List
import base64
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from langchain_core.messages import HumanMessage
from langchain_core.language_models.chat_models import BaseChatModel

from src.routines import crud, schemas
from src.core.integrations.google.auth_utils import get_service_and_timezone
from src.core.integrations.google.calendar_service import sync_db_routine_to_google, delete_google_events_for_routine
from src.routines.models import Routine, ClassSession
from src.calendar.google_client import GoogleCalendarClient
from src.services.vision.extractor import image_extractor
from src.services.vision.schema import WeeklyRoutine


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


async def get_my_routine(db: AsyncSession, user_id: UUID) -> Optional[Routine]:
    return await crud.get_user_routine(db, user_id)

async def create_or_replace_routine(db: AsyncSession, user_id: UUID, routine_data: schemas.RoutineCreate) -> Routine:
    # 1. Check for existing routine
    existing_routine = await crud.get_user_routine(db, user_id)
    
    # 2. Get Google Service
    service, timezone = await get_service_and_timezone(str(user_id), db)

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
    
    new_class = await crud.add_class_to_routine_db(db, routine.id, class_data)
    
    # Sync: Add single event
    service, timezone = await get_service_and_timezone(str(user_id), db)
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
         
    updated_class = await crud.update_class_session_db(db, class_session, update_data)
    
    # Sync: Update event (if exists) or Create (if missing)
    # Ideally, we update the event. But google_client update logic might be complex.
    # For now, let's try to update if we have an ID.
    
    if updated_class.google_event_id:
        service, timezone = await get_service_and_timezone(str(user_id), db)
        if service:
             # TODO: Implement update logic in Google Sync
             # For simplicity, we can delete and re-create, or implement update_event mapping
             pass 
             
    return updated_class
