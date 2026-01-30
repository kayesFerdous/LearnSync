from typing import Optional
from pydantic import BaseModel, HttpUrl

class PresignUploadRequest(BaseModel):
    filename: str
    content_type: str
    file_size: float

class BatchPresignUploadRequest(BaseModel):
    files: list[PresignUploadRequest]


# class BatchUploadResponse(BaseModel):


class PresignUploadResponse(BaseModel):
    filename: str
    upload_url: str
    object_key: str

class BatchPresignUploadResponse(BaseModel):
    files: list[PresignUploadResponse]


class ConfirmUploadRequest(BaseModel):
    original_filename: str
    object_key: str
    conversation_id: Optional[str] = None

class ProcessUrlRequest(BaseModel):
    url: HttpUrl

