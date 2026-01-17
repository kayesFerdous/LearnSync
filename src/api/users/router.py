from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user
from src.api.users.schemas import UserResponse, UserSettings, UserSettingsUpdate
from src.users.model import User
from src.db.session import get_db
from src.users.crud import update_user_settings as crud_update_user_settings

router = APIRouter(prefix="/me", tags=["User Info"])

@router.get("/", response_model=UserResponse)
async def get_user_info(user: User = Depends(get_current_user)):
    """
    Returns the current authenticated user's profile information.
    """
    return user


@router.patch("/settings", response_model=UserSettings)
async def update_user_settings(
    settings_data: UserSettingsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the authenticated user's settings (theme, timezone).
    """
    # Filter out None values so we only update what was sent
    update_data = settings_data.model_dump(exclude_none=True)
    
    if not update_data:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No settings provided to update"
        )

    updated_settings = await crud_update_user_settings(
        user_id=str(user.user_id),
        settings_data=update_data,
        db=db
    )
    
    if not updated_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User settings not found"
        )
        
    return updated_settings

    
