import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.schemas import SignupData, LoginData
from src.core.config import settings
from src.services.brevo_email import send_verification_email
from src.users.repository import (
    create_email_verification_token,
    create_user,
    get_email_verification_token_by_hash,
    get_latest_email_verification_token,
    get_user_by_email_with_identity,
    get_user_by_id,
    get_user_id,
    mark_email_verification_token_used,
    mark_identity_email_verified,
)
from src.users.schemas import UserCreate
from src.auth.service import get_password_hash, verify_password
from src.core.exceptions import (
    EmailNotVerifiedException,
    EmailVerificationDeliveryException,
    EmailVerificationResendTooSoonException,
    EmailVerificationTokenExpiredException,
    EmailVerificationTokenInvalidException,
    InvalidCredentialsException,
    UserAlreadyExistsException,
)
from src.core.logging_config import get_logger

logger = get_logger(__name__)


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _build_verification_url(raw_token: str) -> str:
    base_url = settings.SERVER_LINK.rstrip("/")
    return f"{base_url}/auth/verify-email?token={raw_token}"


async def create_and_send_email_verification(
    *,
    email: str,
    username: str,
    db: AsyncSession,
    enforce_cooldown: bool,
) -> None:
    user = await get_user_by_email_with_identity(email=email, db=db)
    if not user or not user.identity:
        return

    identity = user.identity
    if identity.provider != "email" or identity.is_email_verified:
        return

    if enforce_cooldown:
        last_token = await get_latest_email_verification_token(identity.id, db)
        if last_token and last_token.created_at:
            cooldown = settings.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS
            elapsed = (datetime.now(timezone.utc) - last_token.created_at).total_seconds()
            if elapsed < cooldown:
                raise EmailVerificationResendTooSoonException(
                    f"Please wait {cooldown} seconds before requesting another verification email"
                )

    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=settings.EMAIL_VERIFICATION_TOKEN_TTL_SECONDS
    )
    await create_email_verification_token(identity.id, token_hash, expires_at, db)

    try:
        await send_verification_email(
            to_email=email,
            username=username,
            verification_url=_build_verification_url(raw_token),
        )
    except EmailVerificationDeliveryException:
        logger.error("Failed to send verification email", exc_info=True)
        raise


async def authenticate_user(login_data: LoginData, db: AsyncSession):
    # 1. Get user by email (we need to join with identity to check password)
    user = await get_user_by_email_with_identity(login_data.email, db)
    
    if not user or not user.identity:
        raise InvalidCredentialsException("Invalid email or password")

    # 2. Verify password
    if not user.identity.password_hash:
        raise InvalidCredentialsException("This account uses Google Login. Please sign in with Google.")

    if not verify_password(login_data.password, user.identity.password_hash):
        raise InvalidCredentialsException("Invalid email or password")

    if not user.identity.is_email_verified:
        raise EmailNotVerifiedException("Please verify your email before logging in")
        
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
            is_email_verified=True,
            email_verified_at=datetime.now(timezone.utc),
        )
        
        new_user = await create_user(user_data, db)
        if new_user:
            return str(new_user.user_id)

    except KeyError as e:
        logger.error(f"Missing required user info in token: {e}")
        raise
    except Exception as e:
        logger.error(f"Error in get_or_create_user: {e}")
        raise


async def create_user_by_email(user_info: SignupData, db: AsyncSession):
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
            password_hash=hashed_password,
            is_email_verified=False,
        )

        new_user = await create_user(user_data, db)
        return new_user

    except Exception as e:
        logger.error(f"Error in create_user_by_email: {e}")
        raise


async def resend_verification_email(email: str, db: AsyncSession) -> None:
    user = await get_user_by_email_with_identity(email=email, db=db)
    if not user or not user.identity:
        return

    if user.identity.provider != "email" or user.identity.is_email_verified:
        return

    await create_and_send_email_verification(
        email=user.email,
        username=user.username,
        db=db,
        enforce_cooldown=True,
    )


async def verify_email_token(token: str, db: AsyncSession):
    if not token:
        raise EmailVerificationTokenInvalidException("Invalid verification token")

    token_hash = _hash_token(token)
    verification_token = await get_email_verification_token_by_hash(token_hash, db)

    if not verification_token:
        raise EmailVerificationTokenInvalidException("Invalid verification token")

    if verification_token.used_at is not None:
        raise EmailVerificationTokenInvalidException("Verification token has already been used")

    if verification_token.expires_at <= datetime.now(timezone.utc):
        raise EmailVerificationTokenExpiredException("Verification token has expired")

    consumed_token = await mark_email_verification_token_used(verification_token.id, db)
    if not consumed_token:
        raise EmailVerificationTokenInvalidException("Invalid verification token")

    identity = await mark_identity_email_verified(consumed_token.identity_id, db)
    if not identity:
        raise EmailVerificationTokenInvalidException("Invalid verification token")

    user = await get_user_by_id(str(identity.user_id), db)
    if not user:
        raise EmailVerificationTokenInvalidException("User not found for verification token")

    return user
