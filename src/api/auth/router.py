import logging
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, Request, Response, status
from authlib.integrations.base_client.errors import OAuthError

from src.db.session import get_db
from src.core.config import settings
from src.services.google_auth import oauth
from src.users.service import get_or_create_user
from src.auth.service import create_access_token, get_current_user

# Use a standard logger for logging events and errors.
log = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


FRONTEND_LINK = settings.FRONTEND_LINK
SERVER_URL = settings.SERVER_LINK
COOKIE_SECURE = settings.COOKIE_SECURE


@router.get("/login", summary="Initiate Google OAuth login")
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
    """
    Handles the server-side part of the OAuth flow. It:
    1. Exchanges the authorization code from Google for an access token.
    2. Retrieves or creates a user in the database based on the token info.
    3. Creates a session JWT.
    4. Sets the JWT in a secure, HTTP-only cookie.
    5. Redirects the user back to the client application.
    """
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
        print(token)
        user_id = await get_or_create_user(token=token, db=db)
        if not user_id:
            # This case suggests a logic error where a user could not be found or created
            # from a valid token. It should be logged as a server-side issue.
            log.error("get_or_create_user unexpectedly returned no user_id.")
            return RedirectResponse(url=failure_redirect_url)
    except Exception as e:
        # This catches potential database errors or other issues during user lookup/creation.
        log.error(f"Failed to get or create user: {e}", exc_info=True)
        return RedirectResponse(url=failure_redirect_url)

    try:
        jwt_token = await create_access_token(user_id)
        response = RedirectResponse(url=f"{FRONTEND_LINK}?status=success")
        response.set_cookie(
            key=settings.COOKIE_NAME,
            value=jwt_token,
            httponly=True,  # Mitigates XSS by preventing client-side script access.
            samesite="lax",  # Provides a balance of security (CSRF) and usability.
            max_age=60 * 60 * 24 * 7,  # 7 days
            secure=COOKIE_SECURE,  # Should be True in production to enforce HTTPS.
        )
        return response
    except Exception as e:
        log.error(f"Failed to create JWT or set cookie: {e}", exc_info=True)
        return RedirectResponse(url=failure_redirect_url)


@router.get("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Log out user")
async def logout(response: Response):
    """
    Deletes the session cookie to terminate the user's session.
    """
    response.delete_cookie(settings.COOKIE_NAME)
    # By returning nothing (None), FastAPI sends a response with the status code
    # from the decorator (204 No Content) while applying the cookie modification.
    return


@router.get("/protected", summary="Example of a protected route")
async def protected_route_example(user_id: str = Depends(get_current_user)):
    """
    An example endpoint that requires authentication. The `get_current_user`
    dependency handles the verification of the session cookie.
    """
    return {"message": f"Hello, user {user_id}!"}
