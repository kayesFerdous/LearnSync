from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.users.model import User, UserIdentity


async def get_user(email: str, db: AsyncSession):
    try:
        query = select(User.user_id).where(User.email == email).limit(1)
        result = await db.execute(query)
        user_id = result.scalar_one_or_none()

        if user_id:
            return str(user_id)
        return None

    except Exception as e:
        print(f"Error in get_user def\n{str(e)}")


async def create_user(token: dict, db: AsyncSession):
    try:
        new_identity = UserIdentity(
            provider='google',
            external_sub=token['userinfo']['sub'],
            refresh_token=token.get('refresh_token'),
            access_token = token.get('access_token'),
        )

        new_user =  User(
            username = token['userinfo']['name'],
            email = token['userinfo']['email'],
            given_name =  token['userinfo']['given_name'],
            identity=new_identity
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return str(new_user.user_id)

    except Exception as e:
        print(f"Error in create_user def\n{str(e)}")


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

