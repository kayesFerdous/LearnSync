from pydantic import SecretStr
from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    GOOGLE_API_KEY:SecretStr
    GROQ_API_KEY:SecretStr
    COHERE_API_KEY:SecretStr
    PINECONE_API_KEY: str
    PDF_PATH:str
    FRONTEND_LINK:str

    #INFO: supabase credentials
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_BUCKET: str
    SUPABASE_FOLDER: str

    #INFO: cloudflare credentials
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str
    

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings() #type:ignore

