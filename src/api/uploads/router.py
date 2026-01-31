from fastapi import APIRouter, Request, BackgroundTasks, Depends
from uuid import uuid4
from fastapi.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from src.api.uploads.schemas import BatchConfirmUploadRequest, BatchPresignUploadRequest, PresignUploadRequest, PresignUploadResponse, ProcessUrlRequest, BatchPresignUploadResponse
from src.core.config import settings
from src.api.dependencies import get_current_user
from src.users.model import User
from src.services.file_processing import process_content
from src.db.session import get_db
from src.conversations.service import create_conversation

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

@router.post("/presign", response_model=BatchPresignUploadResponse)
async def presign_upload(
    req: Request,
    upload_request: BatchPresignUploadRequest,
    _: User = Depends(get_current_user)
):
    # Extension map for object keys
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

    response_files = []

    # Calculate total size
    total_size = sum(f.file_size for f in upload_request.files)
    if total_size > settings.MAX_TOTAL_UPLOAD_SIZE:
        raise HTTPException(400, f"Total upload size {total_size} exceeds maximum of {settings.MAX_TOTAL_UPLOAD_SIZE} bytes")

    # Validate and process all files
    for file_req in upload_request.files:
        if file_req.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(400, f"Invalid content type for file {file_req.filename}. Allowed: {ALLOWED_CONTENT_TYPES}")
        
        if file_req.file_size > settings.MAX_UPLOAD_SIZE:
             raise HTTPException(400, f"File {file_req.filename} exceeds maximum size of {settings.MAX_UPLOAD_SIZE} bytes")

        file_ext = ext_map.get(file_req.content_type, "")
        object_key = f"uploads/{uuid4()}{file_ext}"

        r2_client = req.app.state.r2_client
        url = r2_client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.R2_BUCKET_NAME,
                "Key": object_key,
                "ContentType": file_req.content_type,
            },
            ExpiresIn=60,
        )

        response_files.append(PresignUploadResponse(
            filename=file_req.filename,
            upload_url=url,
            object_key=object_key
        ))

    return BatchPresignUploadResponse(files=response_files)

@router.post("/confirm")
async def confirm_upload(
    req: Request,
    confirm_req: BatchConfirmUploadRequest,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Confirms the upload and triggers background processing.
    """
    conversation_id = confirm_req.conversation_id
    if not conversation_id:
        conversation_id = await create_conversation(db, user.user_id)

    # process_content will download the file from R2 and handle ingestion
    processed_files = []
    
    for file_info in confirm_req.files:
        background_tasks.add_task(
            process_content,
            source=file_info.object_key,
            user_id=str(user.user_id),
            llm=req.app.state.gemini_llm,
            original_filename=file_info.original_filename,
            is_url=False,
            folder_id=confirm_req.folder_id,
            conversation_id=conversation_id
        )
        processed_files.append(file_info.object_key)
    
    return {
        "message": "Files queued for processing", 
        "processed_files": processed_files,
        "conversation_id": conversation_id
    }


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
        llm=req.app.state.gemini_llm,
        is_url=True,
        folder_id=process_url_req.folder_id,
    )
    
    return {"message": "URL queued for processing", "url": str(process_url_req.url)}
