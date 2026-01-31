from fastapi import APIRouter, Request, BackgroundTasks, Depends
from uuid import uuid4
from fastapi.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from src.api.uploads.schemas import (
    BatchConfirmUploadRequest, 
    BatchPresignUploadRequest, 
    PresignUploadRequest, 
    PresignUploadResponse, 
    ProcessUrlRequest, 
    BatchPresignUploadResponse,
    FileStatusResponse,
    ProcessingStatus
)
from src.core.config import settings
from src.api.dependencies import get_current_user
from src.users.model import User
from src.services.file_processing import process_content
from src.db.session import get_db
from src.conversations.service import (
    create_conversation, 
    create_pending_file, 
    get_file_status
)
from uuid import UUID

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
    
    # Only create a default conversation if no context (folder or conversation) is provided
    if not conversation_id and not confirm_req.folder_id:
        conversation_id = await create_conversation(db, user.user_id)

    # process_content will download the file from R2 and handle ingestion
    processed_files = []
    
    for file_info in confirm_req.files:
        # Create initial PENDING record via service
        new_file = await create_pending_file(
            db=db,
            user_id=user.user_id,
            filename=file_info.original_filename,
            file_path=file_info.object_key,
            folder_id=UUID(confirm_req.folder_id) if confirm_req.folder_id else None,
            conversation_id=UUID(conversation_id) if conversation_id else None
        )

        background_tasks.add_task(
            process_content,
            file_id=str(new_file.id), # Pass ID instead of raw data
            source=file_info.object_key,
            user_id=str(user.user_id),
            llm=req.app.state.gemini_llm,
            original_filename=file_info.original_filename,
            is_url=False
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
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers background processing for a directly provided URL.
    """
    # Create initial PENDING record via service
    new_file = await create_pending_file(
        db=db,
        user_id=user.user_id,
        filename=str(process_url_req.url),
        file_path=str(process_url_req.url),
        folder_id=UUID(process_url_req.folder_id) if process_url_req.folder_id else None
    )

    background_tasks.add_task(
        process_content,
        file_id=str(new_file.id),
        source=str(process_url_req.url),
        user_id=str(user.user_id),
        llm=req.app.state.gemini_llm,
        is_url=True,
        # folder_id passed via DB record now, but kept for signature compatibility if needed
    )
    
    return {"message": "URL queued for processing", "url": str(process_url_req.url), "file_id": str(new_file.id)}


@router.get("/files/{file_id}", response_model=FileStatusResponse)
async def get_file_status_endpoint(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the status of a specific file. Used for polling.
    """
    try:
        uuid_id = UUID(file_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    file_record = await get_file_status(db, uuid_id, user.user_id)
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileStatusResponse(
        id=str(file_record.id),
        status=ProcessingStatus(file_record.status.value), # Instantiate schema Enum
        error_message=file_record.error_message,
        filename=file_record.filename
    )
