from pydantic import BaseModel, Field

class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)

class TranslateResponse(BaseModel):
    text: str

