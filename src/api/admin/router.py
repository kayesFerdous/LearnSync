from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import is_admin
from src.db.session import get_db
from src.users.repository import delete_user, get_users
from .schemas import UserRead, UserDeleteRequest, UserDeleteResponse, UsersListResponse


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/users", response_model=UsersListResponse)
async def get_all_users(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of records to return"),
    search: str | None = Query(None, description="Search by username or email"),
    sort_by: str = Query("created_at", description="Field to sort by: user_id, username, email, created_at"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    db: AsyncSession = Depends(get_db),
    _ = Depends(is_admin)
):
    """
    Get all users with pagination, search, and sorting options.
    Only accessible by admins.
    """
    users = await get_users(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return UsersListResponse(
        users=[UserRead.model_validate(u) for u in users],
        total=len(users),
        skip=skip,
        limit=limit
    )


@router.delete("/users", response_model=UserDeleteResponse)
async def remove_user(
    payload: UserDeleteRequest,
    db: AsyncSession = Depends(get_db),
    _ = Depends(is_admin)
):
    """
    Delete a user by ID.
    Only accessible by admins.
    """
    user = await delete_user(payload.user_id, db)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserDeleteResponse(
        message="User deleted successfully",
        user_id=payload.user_id
    )

