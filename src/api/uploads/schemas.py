from typing import Optional
from pydantic import BaseModel, HttpUrl
from datetime import datetime

# Import enums from the single source of truth (the DB model)
from src.conversations.model import ProcessingStatus, FileType


class PresignUploadRequest(BaseModel):
    filename: str
    content_type: str
    file_size: int

class BatchPresignUploadRequest(BaseModel):
    files: list[PresignUploadRequest]


# class BatchUploadResponse(BaseModel):


class PresignUploadResponse(BaseModel):
    filename: str
    upload_url: str
    object_key: str

class BatchPresignUploadResponse(BaseModel):
    files: list[PresignUploadResponse]


class UploadConfirmation(BaseModel):
    original_filename: str
    object_key: str
    content_type: Optional[str] = None  # Optional - file_type can be inferred from filename

class BatchConfirmUploadRequest(BaseModel):
    folder_id: Optional[str] = None
    conversation_id: Optional[str] = None
    files: list[UploadConfirmation]

class ProcessUrlRequest(BaseModel):
    folder_id: Optional[str] = None
    conversation_id: Optional[str] = None
    url: HttpUrl

class FileStatusResponse(BaseModel):
    id: str
    status: ProcessingStatus
    error_message: Optional[str] = None
    filename: str


class BatchConfirmFileResponse(BaseModel):
    filename: str
    file_id: str
    object_key: str

class BatchConfirmResponse(BaseModel):
    message: str
    processed_files: list[str] # legacy
    files: list[BatchConfirmFileResponse]
    conversation_id: str


class FolderFileResponse(BaseModel):
    id: str
    filename: str
    file_type: FileType
    status: ProcessingStatus
    created_at: datetime

    class Config:
        from_attributes = True


class FolderFilesListResponse(BaseModel):
    files: list[FolderFileResponse]
    total: int


class DeleteFileResponse(BaseModel):
    message: str
    file_id: str
    filename: str



