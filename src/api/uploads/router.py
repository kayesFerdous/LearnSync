from fastapi import APIRouter, Request, BackgroundTasks, Depends
from uuid import uuid4
from fastapi.exceptions import HTTPException
import logging

from src.api.uploads.schemas import ConfirmUploadRequest, PresignUploadRequest, PresignUploadResponse, ProcessUrlRequest
from src.core.config import settings
from src.api.dependencies import get_current_user
from src.users.model import User
from src.services.file_processing import process_content

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", # .docx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", # .pptx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", # .xlsx
    "image/png",
    "image/jpeg",
    "image/tiff",
    "text/html",
    "text/plain",
    "text/markdown"
}

@router.post("/presign", response_model=PresignUploadResponse)
async def presign_upload(
    req: Request,
    upload_request: PresignUploadRequest,
    _: User = Depends(get_current_user)
):

    if upload_request.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(400, f"Invalid content type. Allowed: {ALLOWED_CONTENT_TYPES}")

    # Extract extension from content type for the object key
    ext_map = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/tiff": ".tiff",
        "text/html": ".html",
        "text/plain": ".txt",
        "text/markdown": ".md"
    }
    file_ext = ext_map.get(upload_request.content_type, "")
    
    object_key = f"uploads/{uuid4()}{file_ext}"

    r2_client = req.app.state.r2_client
    url = r2_client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.R2_BUCKET_NAME,
            "Key": object_key,
            "ContentType": upload_request.content_type,
        },
        ExpiresIn=60,
    )

    return PresignUploadResponse(
        upload_url=url,
        object_key=object_key
    )

@router.post("/confirm")
async def confirm_upload(
    req: Request,
    confirm_req: ConfirmUploadRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    """
    Confirms the upload and triggers background processing.
    """
    # process_content will download the file from R2 and handle ingestion
    background_tasks.add_task(
        process_content,
        source=confirm_req.object_key,
        user_id=str(user.user_id),
        llm=req.app.state.gemini_llm_temp_0,
        original_filename=confirm_req.original_filename,
        is_url=False
    )
    
    return {"message": "File queued for processing", "object_key": confirm_req.object_key}


@router.post("/process-url")
async def process_url(
    req: Request,
    process_url_req: ProcessUrlRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user)
):
    """
    Triggers background processing for a directly provided URL.
    """
    background_tasks.add_task(
        process_content,
        source=str(process_url_req.url),
        user_id=str(user.user_id),
        llm=req.app.state.gemini_llm_temp_0,
        is_url=True
    )
    
    return {"message": "URL queued for processing", "url": str(process_url_req.url)}


