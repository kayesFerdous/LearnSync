from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession

from src.core.config import settings


# Create the Async Engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False, 
)

# Create a Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False # Important for async!
)

# Dependency helper (If you use FastAPI later, you'll use this a lot)
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
