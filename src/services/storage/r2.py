import boto3

from src.core.config import settings


async def get_r2_client():
    ENDPINT_URL = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    return boto3.client(
        "s3",
        endpoint_url=ENDPINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )
