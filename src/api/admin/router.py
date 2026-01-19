from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import is_admin
from src.db.session import get_db
from src.users.crud import get_users
from .schemas import UserRead


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/users", response_model=list[UserRead])
async def get_all_users(
    skip: int = 0,
    limit: int = 10,
    search: str | None = None,
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
    return users



