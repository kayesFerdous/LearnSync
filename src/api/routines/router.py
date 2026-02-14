from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File

from src.users.model import User
from src.db.session import get_db
from src.routines import schemas, service
from src.api.dependencies import get_current_user
from src.services.vision.schema import WeeklyRoutine, ApprovedWeeklyRoutine
from src.core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/routines",
    tags=["Routines"]
)


@router.post("/confirm", response_model=schemas.RoutineResponse, status_code=status.HTTP_201_CREATED)
async def confirm_routine(
    routine_data: ApprovedWeeklyRoutine,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Confirm and save an approved routine.
    Converts the vision-specific schema to the internal DB schema,
    updates the database, and syncs to Google Calendar.
    """
    return await service.confirm_routine_from_vision(db, user.user_id, routine_data)


@router.post("/generate-from-image", response_model=WeeklyRoutine)
async def generate_routine_from_image(
    req: Request,
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
):
    """
    Generate a routine from an uploaded image.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid file type. Please upload an image."
        )

    try:
        # Retrieve LLM from app state (Dependency Injection could be improved here globally)
        llm = req.app.state.gemini_llm_temp_0
        contents = await file.read()
        
        routine = await service.extract_routine_from_image(llm, contents, file.content_type)
        return routine
    except Exception as e:
        logger.error(f"Error extracting routine from image: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract routine from the image. Please ensure the image is clear and contains a valid routine."
        )


@router.get("", response_model=schemas.RoutineResponse)
async def get_my_routine(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current user's routine.
    """
    routine = await service.get_my_routine(db, user.user_id)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    return routine


@router.post("", response_model=schemas.RoutineResponse, status_code=status.HTTP_201_CREATED)
async def create_or_replace_routine(
    routine_data: schemas.RoutineCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new routine. If one exists, it is replaced.
    Automatically syncs to Google Calendar.
    """
    return await service.create_or_replace_routine(db, user.user_id, routine_data)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_routine(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete the user's routine.
    Automatically removes events from Google Calendar.
    """
    await service.delete_my_routine(db, user.user_id)


@router.post("/classes", response_model=schemas.ClassSessionResponse, status_code=status.HTTP_201_CREATED)
async def add_class(
    class_data: schemas.ClassSessionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a single class session to the existing routine.
    Automatically adds event to Google Calendar.
    """
    return await service.add_class_session(db, user.user_id, class_data)

@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_class(
    class_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a class session from the routine.
    Automatically removes event from Google Calendar.
    """
    await service.remove_class_session(db, user.user_id, class_id)

@router.patch("/classes/{class_id}", response_model=schemas.ClassSessionResponse)
async def update_class(
    class_id: UUID,
    update_data: schemas.ClassSessionUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a class session.
    (Note: Google Calendar sync for updates is partially implemented)
    """
    return await service.update_class_session(db, user.user_id, class_id, update_data)
