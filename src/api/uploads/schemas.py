from typing import Optional
from pydantic import BaseModel, HttpUrl
from enum import Enum

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

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



