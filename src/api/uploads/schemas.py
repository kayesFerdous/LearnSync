from pydantic import BaseModel

class PresignUploadRequest(BaseModel):
    filename: str
    content_type: str

class PresignUploadResponse(BaseModel):
    upload_url: str
    object_key: str


class ConfirmUploadRequest(BaseModel):
    original_filename: str
    object_key: str
