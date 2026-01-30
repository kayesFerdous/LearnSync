from typing import Optional
from pydantic import BaseModel, HttpUrl

class PresignUploadRequest(BaseModel):
    filename: str
    content_type: str

class PresignUploadResponse(BaseModel):
    upload_url: str
    object_key: str


class ConfirmUploadRequest(BaseModel):
    original_filename: str
    object_key: str
    conversation_id: Optional[str] = None

class ProcessUrlRequest(BaseModel):
    url: HttpUrl

