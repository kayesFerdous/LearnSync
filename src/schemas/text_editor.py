from pydantic import BaseModel


class TextConvertionRequest(BaseModel):
    text: str
