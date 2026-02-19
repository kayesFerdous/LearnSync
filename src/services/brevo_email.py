import httpx

from src.core.config import settings
from src.core.logging_config import get_logger

logger = get_logger(__name__)


class EmailDeliveryException(Exception):
    pass


def _build_verification_email_html(username: str, verification_url: str) -> str:
    display_name = username or "there"
    return f"""
    <div style=\"font-family: Arial, sans-serif; line-height: 1.5; color: #111827;\">
      <h2>Verify your email</h2>
      <p>Hi {display_name},</p>
      <p>Thanks for signing up. Please verify your email by clicking the button below. This link expires in 15 minutes.</p>
      <p>
        <a href=\"{verification_url}\" style=\"display:inline-block;padding:10px 16px;border-radius:6px;background:#111827;color:#ffffff;text-decoration:none;\">
          Verify email
        </a>
      </p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
    """.strip()


async def send_verification_email(to_email: str, username: str, verification_url: str) -> None:
    payload = {
        "sender": {
            "name": settings.BREVO_FROM_NAME,
            "email": settings.BREVO_FROM_EMAIL,
        },
        "to": [{"email": to_email, "name": username}],
        "subject": "Verify your email",
        "htmlContent": _build_verification_email_html(username, verification_url),
    }

    headers = {
        "api-key": settings.BREVO_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"Brevo API responded with non-2xx status: {e.response.text}", exc_info=True)
        raise EmailDeliveryException("Failed to deliver verification email") from e
    except httpx.HTTPError as e:
        logger.error("HTTP error while sending verification email", exc_info=True)
        raise EmailDeliveryException("Failed to deliver verification email") from e
