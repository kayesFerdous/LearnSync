from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload, selectinload

from src.core.logging_config import get_logger
from src.users.model import User, UserIdentity, UserSettings
from src.users.schemas import UserCreate

logger = get_logger(__name__)


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
        new_settings = UserSettings()

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

