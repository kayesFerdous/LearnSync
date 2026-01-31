from uuid import UUID
from sqlalchemy import delete, select, or_, asc, desc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload, selectinload

from src.core.logging_config import get_logger
from src.users.model import User, UserIdentity, UserSettings as UserSettingsModel
from src.users.schemas import UserCreate

logger = get_logger(__name__)


async def get_users(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 10,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> list[User]:
    """
    Fetch basic user info with pagination, search, and sorting.
    Optimized: No relationship loading (settings/identity).
    """
    try:
        # Efficient: SELECT * FROM users
        # noload: Explicitly prevents N+1 lazy loading when schema accesses these fields
        query = select(User).options(
            noload(User.settings),
            noload(User.identity)
        )

        # Apply search filter
        if search:
            search_filter = or_(
                User.username.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
            query = query.where(search_filter)

        # Apply sorting
        valid_sort_fields = {
            "user_id": User.user_id,
            "username": User.username,
            "email": User.email,
            "created_at": User.created_at
        }
        
        sort_column = valid_sort_fields.get(sort_by, User.created_at)
        
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        # Apply pagination
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise




async def get_user_by_email_with_identity(email: str, db: AsyncSession) -> User | None:
    """Fetch a user and their identity by email."""
    try:
        query = (
            select(User)
            .options(selectinload(User.identity)) # Eager load identity
            .where(User.email == email)
            .limit(1)
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error fetching user by email {email}: {e}")
        raise  # Re-raise strictly in production so the API layer knows it was a DB error, not just 'Not Found'


async def get_user_id(email: str, db: AsyncSession) -> str | None:
    """
    Get user id
    """
    try:
        query = select(User.user_id).where(User.email == email).limit(1)
        result = await db.execute(query)
        user_id = result.scalar_one_or_none()

        if user_id:
            return str(user_id)
        return None

    except Exception as e:
        logger.error(f"Error fetching user_id for {email}: {e}")
        raise


async def get_user_by_id(user_id: str, db: AsyncSession) -> User | None:
    try:
        query = (
            select(User)
            .options(noload(User.identity), selectinload(User.settings))
            .where(User.user_id == user_id)
            .limit(1)
        )
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        return user

    except Exception as e:
        logger.error(f"Error fetching user by ID {user_id}: {e}")
        raise


async def delete_user(user_id: str, db: AsyncSession):
    uuid_id = UUID(user_id)
    try:
        query = (
            delete(User)
            .where(User.user_id == uuid_id)
            .returning(User)
        )
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        await db.commit()
        return user

    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting user by ID {user_id}: {e}")
        raise


async def create_user(user_data: UserCreate, db: AsyncSession) -> User | None:
    try:
        new_identity = UserIdentity(
            provider=user_data.provider,
            password_hash=user_data.password_hash,
            external_sub=user_data.external_sub,
            access_token=user_data.access_token,
            refresh_token=user_data.refresh_token,
        )

        # Use Model defaults for settings (defined in src/users/model.py)
        # This prevents duplication of default values "UTC"/"dark" here.
        new_settings = UserSettingsModel()

        new_user = User(
            username=user_data.username,
            email=user_data.email,
            picture=user_data.picture,
            identity=new_identity,
            settings=new_settings
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    except IntegrityError as e:
        await db.rollback()
        logger.warning(f"Integrity error creating user {user_data.email}: {e}")
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error creating user {user_data.email}: {e}")
        raise


async def get_user_identity(user_id: str, db: AsyncSession) -> UserIdentity | None:
    try:
        query = select(UserIdentity).where(UserIdentity.user_id == user_id)
        result = await db.execute(query)
        identity = result.scalar_one_or_none()
        return identity
    except Exception as e:
        logger.error(f"Error fetching user identity for {user_id}: {e}")
        raise


async def update_user_settings(user_id: str, settings_data: dict, db: AsyncSession) -> UserSettingsModel | None:
    try:
        # Fetch existing settings for the user
        query = select(UserSettingsModel).where(UserSettingsModel.user_id == user_id)
        result = await db.execute(query)
        settings_obj = result.scalar_one_or_none()

        if not settings_obj:
            logger.warning(f"Settings not found for user {user_id} during update")
            return None

        # Update fields
        for key, value in settings_data.items():
            if value is not None:
                setattr(settings_obj, key, value)
        
        await db.commit()
        await db.refresh(settings_obj)
        return settings_obj

    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating settings for user {user_id}: {e}")
        raise


async def update_user_profile(user_id: str, update_data: dict, db: AsyncSession) -> User | None:
    """
    Update user profile fields (username, picture).
    """
    try:
        uuid_id = UUID(user_id)
        query = select(User).where(User.user_id == uuid_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            logger.warning(f"User not found for ID {user_id} during profile update")
            return None

        # Update fields
        for key, value in update_data.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)
        
        await db.commit()
        await db.refresh(user)
        return user

    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating profile for user {user_id}: {e}")
        raise
