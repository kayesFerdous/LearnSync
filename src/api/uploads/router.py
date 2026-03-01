from fastapi import APIRouter, Request, BackgroundTasks, Depends
from uuid import uuid4
from fastapi.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from src.api.uploads.schemas import (
    BatchConfirmUploadRequest, 
    BatchPresignUploadRequest, 
    PresignUploadResponse, 
    ProcessUrlRequest, 
    BatchPresignUploadResponse,
    FileStatusResponse,
    BatchConfirmResponse,
    BatchConfirmFileResponse,
    FolderFileResponse,
    FolderFilesListResponse,
    DeleteFileResponse
)
from src.conversations.model import ProcessingStatus, FileType
from src.core.config import settings
from src.api.dependencies import get_current_user
from src.users.model import User
from src.services.file_processing import process_content
from src.db.session import get_db
from src.conversations.service import (
    create_conversation, 
    create_pending_file, 
    get_file_status,
    cancel_upload,
    get_folder_files,
    get_conversation_files,
    delete_file
)
from uuid import UUID

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_CONTENT_TYPES = {
    # Document formats
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", # .docx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", # .pptx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", # .xlsx
    "text/html",
    "text/markdown",
    # Image formats
    "image/png",
    "image/jpeg",
    "image/tiff",
    # Audio formats (ASR support)
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",  # .mp3
    # Video text tracks
    "text/vtt",
}

# Map content types to FileType enum
CONTENT_TYPE_TO_FILE_TYPE = {
    # Document formats
    "application/pdf": FileType.PDF,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileType.DOCX,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": FileType.PPTX,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileType.XLSX,
    "text/html": FileType.HTML,
    "text/markdown": FileType.MARKDOWN,
    # Image formats
    "image/png": FileType.PNG,
    "image/jpeg": FileType.JPEG,
    "image/tiff": FileType.TIFF,
    # Audio formats
    "audio/wav": FileType.WAV,
    "audio/x-wav": FileType.WAV,
    "audio/mpeg": FileType.MP3,
    # Video text tracks
    "text/vtt": FileType.VTT,
}

# Map file extensions to FileType enum
EXTENSION_TO_FILE_TYPE = {
    ".pdf": FileType.PDF,
    ".docx": FileType.DOCX,
    ".pptx": FileType.PPTX,
    ".xlsx": FileType.XLSX,
    ".html": FileType.HTML,
    ".htm": FileType.HTML,
    ".md": FileType.MARKDOWN,
    ".markdown": FileType.MARKDOWN,
    ".png": FileType.PNG,
    ".jpg": FileType.JPEG,
    ".jpeg": FileType.JPEG,
    ".tiff": FileType.TIFF,
    ".tif": FileType.TIFF,
    ".wav": FileType.WAV,
    ".mp3": FileType.MP3,
    ".vtt": FileType.VTT,
}


def get_file_type_from_filename(filename: str) -> FileType:
    """Infer FileType from filename extension."""
    import os
    ext = os.path.splitext(filename)[1].lower()
    return EXTENSION_TO_FILE_TYPE.get(ext, FileType.UNKNOWN)

@router.post("/presign", response_model=BatchPresignUploadResponse)
async def presign_upload(
    req: Request,
    upload_request: BatchPresignUploadRequest,
    _: User = Depends(get_current_user)
):
    # Extension map for object keys
    ext_map = {
        # Document formats
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "text/html": ".html",
        "text/markdown": ".md",
        # Image formats
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/tiff": ".tiff",
        # Audio formats
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/mpeg": ".mp3",
        # Video text tracks
        "text/vtt": ".vtt",
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

@router.post("/confirm", response_model=BatchConfirmResponse)
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
    processed_keys = []
    response_files = []
    
    for file_info in confirm_req.files:
        # Determine file_type from content_type or filename extension
        if file_info.content_type:
            file_type = CONTENT_TYPE_TO_FILE_TYPE.get(
                file_info.content_type, 
                FileType.UNKNOWN
            )
        else:
            file_type = get_file_type_from_filename(file_info.original_filename)
        
        # Create initial PENDING record via service
        new_file = await create_pending_file(
            db=db,
            user_id=user.user_id,
            filename=file_info.original_filename,
            file_path=file_info.object_key,
            folder_id=UUID(confirm_req.folder_id) if confirm_req.folder_id else None,
            conversation_id=UUID(conversation_id) if conversation_id else None,
            file_type=file_type
        )

        background_tasks.add_task(
            process_content,
            file_id=str(new_file.id),
            source=file_info.object_key,
            user_id=str(user.user_id),
            llm=req.app.state.gemini_llm,
            original_filename=file_info.original_filename,
            is_url=False,
            folder_id=confirm_req.folder_id,
            conversation_id=str(conversation_id) if conversation_id else None,
        )
        processed_keys.append(file_info.object_key)
        response_files.append(BatchConfirmFileResponse(
            filename=file_info.original_filename,
            file_id=str(new_file.id),
            object_key=file_info.object_key
        ))
    
    return BatchConfirmResponse(
        message="Files queued for processing", 
        processed_files=processed_keys,
        files=response_files,
        conversation_id=conversation_id
    )


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
    # Create initial PENDING record via service with URL file_type
    new_file = await create_pending_file(
        db=db,
        user_id=user.user_id,
        filename=str(process_url_req.url),
        file_path=str(process_url_req.url),
        folder_id=UUID(process_url_req.folder_id) if process_url_req.folder_id else None,
        conversation_id=UUID(process_url_req.conversation_id) if process_url_req.conversation_id else None, 
        file_type=FileType.URL
    )

    background_tasks.add_task(
        process_content,
        file_id=str(new_file.id),
        source=str(process_url_req.url),
        user_id=str(user.user_id),
        llm=req.app.state.gemini_llm,
        is_url=True,
        folder_id=process_url_req.folder_id,
        conversation_id=process_url_req.conversation_id,
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


@router.post("/files/{file_id}/cancel")
async def cancel_file_upload(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancels a file upload process.
    """
    try:
        uuid_id = UUID(file_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    file_record = await cancel_upload(db, uuid_id, user.user_id)
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
        
    return {"message": "Upload cancelled", "status": "cancelled"}


@router.get("/folders/{folder_id}/files", response_model=FolderFilesListResponse)
async def get_files_for_folder(
    folder_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all files for a specific folder.
    Returns file information suitable for UI rendering.
    """
    try:
        uuid_folder_id = UUID(folder_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")

    files = await get_folder_files(db, uuid_folder_id, user.user_id)
    
    if files is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    response_files = [
        FolderFileResponse(
            id=str(f.id),
            filename=f.filename,
            file_type=FileType(f.file_type.value),
            status=ProcessingStatus(f.status.value),
            created_at=f.created_at
        )
        for f in files
    ]
    
    return FolderFilesListResponse(
        files=response_files,
        total=len(response_files)
    )

@router.get("/conversations/{conversation_id}/files", response_model=FolderFilesListResponse)
async def get_files_for_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all files for a specific conversation.
    Returns file information suitable for UI rendering.
    """
    try:
        uuid_conversation_id = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")

    files = await get_conversation_files(db, uuid_conversation_id, user.user_id)
    
    if files is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    response_files = [
        FolderFileResponse(
            id=str(f.id),
            filename=f.filename,
            file_type=FileType(f.file_type.value),
            status=ProcessingStatus(f.status.value),
            created_at=f.created_at
        )
        for f in files
    ]
    
    return FolderFilesListResponse(
        files=response_files,
        total=len(response_files)
    )

@router.delete("/files/{file_id}", response_model=DeleteFileResponse)
async def delete_file_endpoint(
    req: Request,
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a file and clean up associated resources.
    
    This endpoint:
    1. Verifies file ownership
    2. Deletes the file from R2 storage (if applicable)
    3. Removes vectors from the vector store
    4. Removes the database record
    """
    try:
        uuid_id = UUID(file_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file ID format")

    # Delete from database (with ownership verification)
    file_record = await delete_file(db, uuid_id, user.user_id)
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Clean up R2 object if it's not a URL type
    # Using file_type is more robust than checking file_path string
    if file_record.file_type != FileType.URL:
        try:
            r2_client = req.app.state.r2_client
            r2_client.delete_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=file_record.file_path
            )
            logger.info(f"Deleted R2 object: {file_record.file_path}")
        except Exception as e:
            # Log warning but don't fail the request
            # The file might have already been deleted or never existed
            logger.warning(f"Failed to delete R2 object {file_record.file_path}: {e}")
    
    # Clean up vectors from Qdrant
    # Using file_id as the document_id for proper tracking
    try:
        from qdrant_client import models
        from src.rag.store import _get_qdrant_client
        from src.core.config import settings as app_settings

        qdrant_client = _get_qdrant_client()
        # Delete all points where metadata.document_id matches this file's ID
        qdrant_client.delete(
            collection_name=app_settings.QDRANT_COLLECTION_NAME,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="metadata.document_id",
                            match=models.MatchValue(value=str(file_record.id)),
                        )
                    ]
                )
            ),
        )
        logger.info(f"Deleted vector chunks for file {file_record.id}")
    except Exception as e:
        # Log warning but don't fail - vectors might not have been created yet
        logger.warning(f"Failed to delete vectors for file {file_record.id}: {e}")
    
    return DeleteFileResponse(
        message="File deleted successfully",
        file_id=str(file_record.id),
        filename=file_record.filename
    )

