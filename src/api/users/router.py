from fastapi import APIRouter, Depends

from src.api.dependencies import get_current_user
from src.api.users.schemas import UserResponse
from src.users.model import User

router = APIRouter(tags=["User Info"])

@router.get("/me", response_model=UserResponse)
async def get_user_info(user: User = Depends(get_current_user)):
    """
    Returns the current authenticated user's profile information.
    """
    return user