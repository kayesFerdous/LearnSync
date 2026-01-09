from sqlalchemy.ext.asyncio import AsyncSession

from src.users.crud import get_user, create_user

class EmptyTokenException(Exception):
    pass

async def get_or_create_user(token: dict, db: AsyncSession):
    try:
        user_id = await get_user(token['userinfo']['email'], db)

        #check if the user exixtes in the database
        if user_id:
            return user_id

        # If the user login for the first time
        user_id = await create_user(token, db)

        return user_id

    except Exception as e:
        print(f"Error in get_or_create_user def\n{str(e)}")

