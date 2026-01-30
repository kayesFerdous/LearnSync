from typing import Optional
from pydantic import BaseModel, HttpUrl

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
    conversation_id: Optional[str] = None
    files: list[UploadConfirmation]

class ProcessUrlRequest(BaseModel):
    url: HttpUrl

