from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.schemas import SignupRequest, LoginRequest
from src.users.crud import get_user_id, create_user, get_user_by_email_with_identity
from src.users.schemas import UserCreate
from src.auth.service import get_password_hash, verify_password

class EmptyTokenException(Exception):
    pass

class InvalidCredentialsException(Exception):
    pass

class UserAlreadyExistsException(Exception):
    pass


async def authenticate_user(login_data: LoginRequest, db: AsyncSession):
    # 1. Get user by email (we need to join with identity to check password)
    user = await get_user_by_email_with_identity(login_data.email, db)
    
    if not user or not user.identity:
        raise InvalidCredentialsException("Invalid email or password")

    # 2. Verify password
    if not user.identity.password_hash:
        raise InvalidCredentialsException("This account uses Google Login. Please sign in with Google.")

    if not verify_password(login_data.password, user.identity.password_hash):
        raise InvalidCredentialsException("Invalid email or password")
        
    return user


async def get_or_create_user(token: dict, db: AsyncSession) -> str | None:
    try:
        email = token['userinfo']['email']
        user_id = await get_user_id(email, db)

        if user_id:
            return user_id

        user_data = UserCreate(
            username=token['userinfo']['name'],
            email=email,
            picture=token['userinfo'].get('picture'),
            provider="google",
            external_sub=token['userinfo']['sub'],
            access_token=token.get('access_token'),
            refresh_token=token.get('refresh_token'),
        )
        
        new_user = await create_user(user_data, db)
        if new_user:
            return str(new_user.user_id)

    except Exception as e:
        print(f"Error in get_or_create_user def\n{str(e)}")
        raise e


async def create_user_by_email(user_info: SignupRequest, db: AsyncSession):
    # 1. Check if user already exists
    existing_user_id = await get_user_id(user_info.email, db)
    if existing_user_id:
        raise UserAlreadyExistsException("User with this email already exists")

    # 2. Hash the password
    hashed_password = get_password_hash(user_info.password)

    try:
        user_data = UserCreate(
            username=user_info.username,
            email=user_info.email,
            picture="",
            provider="email",
            external_sub=user_info.email, # For email users, email is the unique identifier
            password_hash=hashed_password
        )

        new_user = await create_user(user_data, db)
        return new_user

    except Exception as e:
        print(f"Error in create_user_by_email def\n{str(e)}")
        raise e
