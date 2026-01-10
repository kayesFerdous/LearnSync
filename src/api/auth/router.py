import logging
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, Request, Response, status, HTTPException
from authlib.integrations.base_client.errors import OAuthError

from src.db.session import get_db
from src.api.auth.schemas import AuthResponse, SignupRequest, LoginRequest
from src.core.config import settings
from src.services.google_auth import oauth
from src.users.service import create_user_by_email, get_or_create_user, authenticate_user, InvalidCredentialsException, UserAlreadyExistsException
from src.auth.service import create_access_token
from src.api.dependencies import get_current_user

# Use a standard logger for logging events and errors.
log = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


FRONTEND_LINK = settings.FRONTEND_LINK
SERVER_URL = settings.SERVER_LINK
COOKIE_SECURE = settings.COOKIE_SECURE


@router.post(
    "/signup", 
    response_model=AuthResponse,
    summary="Initiate email SignUp"
)
async def signup(
    user_info: SignupRequest, 
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Note: create_user_by_email returns a User object. 
        new_user = await create_user_by_email(user_info, db)

        if new_user:
            user_id = new_user.user_id
            
            # Generate token for immediate login after signup
            jwt_token = await create_access_token(str(user_id))
            
            response.set_cookie(
                key=settings.COOKIE_NAME,
                value=jwt_token,
                httponly=True,
                samesite="lax",
                max_age=60 * 60 * 24 * 7,
                secure=COOKIE_SECURE,
            )
            
            return AuthResponse(
                user_id=user_id,
                message="Login successful",
            )
    except UserAlreadyExistsException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        log.error(f"Signup error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal signup error"
        )

@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Email/Password Login"
)
async def login_email(
    login_data: LoginRequest, 
    response: Response, 
    db: AsyncSession = Depends(get_db)
):
    try:
        user = await authenticate_user(login_data, db)
        
        user_id = user.user_id
        jwt_token = await create_access_token(str(user_id))
        
        response.set_cookie(
            key=settings.COOKIE_NAME,
            value=jwt_token,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7,
            secure=COOKIE_SECURE,
        )
        
        # We need to fetch the user again to return details, or just return basic info.
        # authenticate_user only returned ID. Let's trust the input email.
        return AuthResponse(
            user_id=user_id,
            message="Login successful",
        )
        
    except InvalidCredentialsException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        log.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal login error"
        )


@router.get("/login/google", summary="Initiate Google OAuth login")
async def login(request: Request):
    """
    Redirects the user to Google's authentication page to begin the OAuth2 flow.
    The `redirect_uri` informs Google where to send the user back after authentication.
    """
    # An absolute URI is required by Google for the redirect.
    # redirect_uri = f"{SERVER_URL}/auth/callback"
    redirect_uri = "http://localhost:8000/auth/callback"
    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
        access_type="offline",
        prompt="consent"
    )


@router.get("/callback", summary="Handle Google OAuth callback")
async def auth_callback(request: Request, db: AsyncSession = Depends(get_db)):

    #INFO:
    # Handles the server-side part of the OAuth flow. It:
    # 1. Exchanges the authorization code from Google for an access token.
    # 2. Retrieves or creates a user in the database based on the token info.
    # 3. Creates a session JWT.
    # 4. Sets the JWT in a secure, HTTP-only cookie.
    # 5. Redirects the user back to the client application.

    # Define a generic failure URL to avoid leaking implementation details.
    failure_redirect_url = f"{FRONTEND_LINK}?error=authentication_failed"

    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        log.error(f"OAuth error during Google token exchange: {e.error}", exc_info=True)
        return RedirectResponse(url=failure_redirect_url)
    except Exception as e:
        log.error(f"An unexpected error occurred during token exchange: {e}", exc_info=True)
        return RedirectResponse(url=failure_redirect_url)

    try:
        user_id = await get_or_create_user(token=token, db=db)
        if not user_id:
            log.error("get_or_create_user unexpectedly returned no user_id.")
            return RedirectResponse(url=failure_redirect_url)
    except Exception as e:
        log.error(f"Failed to get or create user: {e}", exc_info=True)
        return RedirectResponse(url=failure_redirect_url)

    try:
        jwt_token = await create_access_token(user_id)
        response = RedirectResponse(url=f"{FRONTEND_LINK}?status=success")
        response.set_cookie(
            key=settings.COOKIE_NAME,
            value=jwt_token,
            httponly=True,
            samesite="lax",
            max_age=60 * 60 * 24 * 7,  #INFO: 7 days
            secure=COOKIE_SECURE,  #NOTE: Should be True in production to enforce HTTPS.
        )
        return response
    except Exception as e:
        log.error(f"Failed to create JWT or set cookie: {e}", exc_info=True)
        return RedirectResponse(url=failure_redirect_url)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Log out user")
async def logout(response: Response):
    response.delete_cookie(settings.COOKIE_NAME)
    return


@router.get("/protected", summary="Example of a protected route")
async def protected_route_example(user = Depends(get_current_user)):
    return {"message": f"Hello, user {user}!"}
