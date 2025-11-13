from pydantic import SecretStr
from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    GOOGLE_API_KEY:SecretStr
    GROQ_API_KEY:SecretStr
    COHERE_API_KEY:SecretStr
    PINECONE_API_KEY: str
    PDF_PATH:str
    FRONTEND_LINK:str

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings() #type:ignore

