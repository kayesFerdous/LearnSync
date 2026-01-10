from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload, selectinload

from src.users.model import User, UserIdentity
from src.users.schemas import UserCreate


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
        print(f"Error in get_user_by_email_with_identity: {e}")
        return None


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
        print(f"Error in get_user_id def\n{str(e)}")


async def get_user_by_id(user_id: str, db: AsyncSession) -> User | None:
    try:
        query = (
            select(User)
            .options(noload(User.identity))
            .where(User.user_id == user_id)
            .limit(1)
        )
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if user:
            return user
        return None

    except Exception as e:
        print(f"Error in get_user_by_id def\n{str(e)}")


async def create_user( user_data: UserCreate, db: AsyncSession ) -> User | None:
    try:
        new_identity = UserIdentity(
            provider = user_data.provider,
            password_hash = user_data.password_hash,
            external_sub = user_data.external_sub,
            access_token = user_data.access_token,
            refresh_token = user_data.refresh_token,
        )

        new_user =  User(
            username = user_data.username,
            email = user_data.email,
            picture = user_data.picture,
            identity= new_identity,
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    except Exception as e:
        print(f"Error in create_user def\n{str(e)}")
        await db.rollback()
        raise e


async def get_user_identity(user_id: str, db: AsyncSession) -> UserIdentity | None:
    try:
        # We need to cast the string user_id to UUID if the DB expects it, 
        # but SQLAlchemy usually handles string-to-UUID coercion for PG UUID columns.
        query = select(UserIdentity).where(UserIdentity.user_id == user_id)
        result = await db.execute(query)
        identity = result.scalar_one_or_none()
        return identity
    except Exception as e:
        print(f"Error fetching user identity for {user_id}: {e}")
        return None

