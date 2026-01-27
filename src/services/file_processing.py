import os
import tempfile
import logging
from uuid import uuid4
from typing import Optional
from src.services.storage.r2 import get_r2_client
from src.core.config import settings
from src.rag.ingestion import ingest_file

logger = logging.getLogger(__name__)

async def process_content(
    source: str,
    user_id: str,
    original_filename: Optional[str] = None,
    is_url: bool = False
):
    """
    Background task to process content (File from R2 or direct URL):
    1. If R2: Download to temp.
    2. If URL: Pass directly.
    3. Ingest (Parse -> Chunk -> Embed -> Store).
    4. Cleanup (if temp file used).
    """
    tmp_path = None
    processing_source = source
    
    try:
        logger.info(f"Starting processing for: {source} (User: {user_id}, URL: {is_url})")
        
        # Generate a document ID
        document_id = str(uuid4())

        if not is_url:
            # Handle R2 Download
            r2 = await get_r2_client()
            
            # Create a temp file to store the download
            file_ext = os.path.splitext(source)[1]
            if not file_ext and original_filename:
                 file_ext = os.path.splitext(original_filename)[1]
            if not file_ext:
                file_ext = ".pdf" # Default fallback
                
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
                tmp_path = tmp_file.name
                
            logger.debug(f"Downloading {source} to {tmp_path}")
            r2.download_file(settings.R2_BUCKET_NAME, source, tmp_path)
            processing_source = tmp_path
        
        # 2. Ingest
        # processing_source is either a local file path or a URL string
        logger.info(f"Ingesting content from {processing_source}...")
        
        await ingest_file(
            file_path=processing_source,
            user_id=user_id,
            document_id=document_id
        )
        
        logger.info(f"Successfully processed {source}")
        
    except Exception as e:
        logger.error(f"Error processing {source}: {e}", exc_info=True)
        # TODO: Here you would update the DB status to 'FAILED'
        
    finally:
        # 3. Cleanup temp file if it exists
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file {tmp_path}: {e}")
