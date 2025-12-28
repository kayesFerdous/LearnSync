from fastapi import APIRouter
from uuid import uuid4
from fastapi.exceptions import HTTPException

from src.api.uploads.schemas import ConfirmUploadRequest, PresignUploadRequest, PresignUploadResponse
from src.services.storage.r2 import create_r2_client
from src.core.config import settings

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/presign", response_model=PresignUploadResponse)
async def presign_upload(req: PresignUploadRequest):

    if req.content_type != "application/pdf":
        raise HTTPException(400, "Invalid content type")

    object_key = f"uploads/{uuid4()}.pdf"

    r2_client = await create_r2_client()
    url = r2_client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.R2_BUCKET_NAME,
            "Key": object_key,
            "ContentType": req.content_type,
        },
        ExpiresIn=60,
    )

    return PresignUploadResponse(
        upload_url=url,
        object_key=object_key
    )

@router.post("/confirm")
async def confirm_upload(req: ConfirmUploadRequest):
    # if req not None:
    return {"message": "ok"}


