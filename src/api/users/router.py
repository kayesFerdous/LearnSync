from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.db.session import get_db
from src.api.dependencies import get_current_user
from src.users.model import User
from src.users.repository import get_users, get_user_by_id
from src.users.schemas import UserRead, UserPublic

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserPublic)
async def get_user(
    user_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a user's public profile by ID.
    """
    user = await get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.get("", response_model=List[UserRead])
async def search_users(
    search: str | None = Query(None, description="Search by username or email"),
    skip: int = 0,
    limit: int = 10,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search for users by username or email.
    """
    users = await get_users(db, skip=skip, limit=limit, search=search)
    return users
