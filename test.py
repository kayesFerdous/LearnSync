import os
from uuid import uuid4
from langchain_docling.loader import DoclingLoader, ExportType
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.summarize import load_summarize_chain
from fastapi import FastAPI, UploadFile
import tempfile
import shutil

from src.core.logging_config import get_logger
from src.services.llm_service import setup_vector_store

app = FastAPI()

log = get_logger(__name__)

# async def summrize(file: UploadFile):
    



async def process_file_upload(file: UploadFile):
    with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name
        log.info(f"Temp file created at: {temp_path}")
    try:
      await load_and_index(temp_path)
    except Exception as e:
        log.error(f"Error while loading the source: {str(e)}")


async def load_and_index(source: str, is_url: bool = False):
    try:
        loader = DoclingLoader(
            file_path=source,
            export_type=ExportType.MARKDOWN
        )
        docs = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        upload_id = uuid4()

        log.debug("Adding upload_id in each Document")
        for doc in splits: 
            doc.metadata['upload_id'] = upload_id
        log.debug("Added upload_id in each Document")
        
        vector_store = await setup_vector_store("test")
        await vector_store.aadd_documents(splits)
        log.info(f"Successfully indexed {len(splits)} chunks from source: {source}")

        # vector_store.


    except Exception as e:
        log.error(f"Error while loading the source: {str(e)}")
    finally:
        if not is_url:
            os.remove(source)
            log.info(f"Temp file({source}) has been deleted")




@app.post("/")
async def get_file(file: UploadFile):
    await process_file_upload(file)
