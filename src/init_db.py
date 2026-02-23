import logging
import asyncio
import sys
from pathlib import Path

# Add project root to path so we can import 'src'
sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine
from src.core.config import settings
from src.db.base import Base

# Import ALL discovered SQLAlchemy models to ensure they are registered with Base.metadata
# Users
from src.users.model import User, UserIdentity, UserSettings

# Routines
from src.routines.models import Routine, ClassSession

# Conversations & Files (Mindmap is also in conversations/model.py)
from src.conversations.model import Conversation, Folder, File, Mindmap

# Quizzes
from src.quizzes.model import Quiz, QuizQuestion
# Note: Option/Explanation might be JSON fields or Pydantic models in QuizQuestion, 
#       but if they were SQL models they'd be exported here. 
#       Based on src/quizzes/model.py viewing, QuizQuestion has 'options' as JSON.

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    logger.info("Connecting to database...")
    # Use echo=True to see SQL commands being executed
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        logger.info("Initializing tables (existing tables and data will be preserved)...")
        # Create all tables defined in Base.metadata
        # checkfirst=True ensures that existing tables are NOT dropped or overwritten
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    
    logger.info("Database initialized successfully.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())