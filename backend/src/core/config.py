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
    ALGORITHM:str

    # #INFO: supabase credentials
    # SUPABASE_URL: str
    # SUPABASE_ANON_KEY: str
    # SUPABASE_BUCKET: str
    # SUPABASE_FOLDER: str

    #INFO: email providers credentials
    BREVO_API_KEY: str
    BREVO_FROM_EMAIL: str
    BREVO_FROM_NAME: str

    EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: int = 900
    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: int = 60
    EMAIL_VERIFICATION_SUCCESS_PATH: str = "/auth/verified"
    EMAIL_VERIFICATION_ERROR_PATH: str = "/auth/verify-error"

    #INFO: cloudflare credentials
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str

    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024 # 10MB
    MAX_TOTAL_UPLOAD_SIZE: int = 20 * 1024 * 1024 # 20MB

    # Qdrant Vector Store
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION_NAME: str = "rag_collection"
    QDRANT_VECTOR_DIM: int = 1024

    # Ollama Embeddings
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_EMBEDDING_MODEL: str = "qwen3-embedding:0.6b"

    # Session
    SESSION_SECRET_KEY: str = "change-me-in-production"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings() #type:ignore

