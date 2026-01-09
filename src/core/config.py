from pydantic_settings import BaseSettings,SettingsConfigDict

class Settings(BaseSettings):
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_API_KEY: str
    GROQ_API_KEY: str
    COHERE_API_KEY: str
    PINECONE_API_KEY: str
    PDF_PATH:str

    FRONTEND_LINK:str
    SERVER_LINK: str
    DATABASE_URL: str
    JWT_SECRET_KEY:str
    COOKIE_NAME:str
    COOKIE_SECURE: bool
    ACCESS_TOKEN_EXPIRE_MINUTES:float

    # #INFO: supabase credentials
    # SUPABASE_URL: str
    # SUPABASE_ANON_KEY: str
    # SUPABASE_BUCKET: str
    # SUPABASE_FOLDER: str

    #INFO: cloudflare credentials
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str
    

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings() #type:ignore

