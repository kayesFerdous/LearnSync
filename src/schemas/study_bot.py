from pydantic import BaseModel

class URLUploadequest(BaseModel):
    url: str

class UploadResponse(BaseModel):
    id: str
    name: str
