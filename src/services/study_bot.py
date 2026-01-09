# import os
# import uuid
# import shutil
# import tempfile
# from fastapi import UploadFile
# from langchain_core.embeddings import Embeddings
# from langchain_core.language_models import BaseChatModel
# from langchain_docling.loader import DoclingLoader, ExportType
# from langchain_text_splitters import RecursiveCharacterTextSplitter
#
# from src.core.logging_config import get_logger
# from src.schemas.study_bot import UploadResponse
# from src.services.llm_service import setup_embeddings, setup_groq_llm, setup_vector_store
#
#
# log = get_logger(__name__)
#
# class StudyBot():
#     def __init__(self, llm: BaseChatModel, embeddings: Embeddings):
#         self.llm = llm
#         self.embeddings = embeddings
#
#
#     @classmethod
#     async def init(cls):
#         llm = await setup_groq_llm(max_tokens=2000)
#         embeddings = await setup_embeddings()
#         return cls(llm, embeddings)
#
#
#     def _strip_url_to_domain(self, url: str) -> str:
#         domain = url.replace('https://', '').replace('http://', '')
#         return domain.rstrip('/').lstrip("/").replace("/", "-")
#
#
#     async def load_and_index(
#             self,
#             source: str, 
#             is_url: bool = True, 
#             file_name: str = ""
#     ) -> UploadResponse:
#         log.debug(f"Starting load_and_index for source: {source}, is_url: {is_url}")
#
#         try:
#             loader = DoclingLoader(
#                 file_path=source,
#                 export_type=ExportType.MARKDOWN
#             )
#             log.debug(f"Loading documents from source: {source}")
#             docs = await loader.aload()
#             log.debug(f"Loaded {len(docs)} document(s)")
#
#             log.debug("Adding upload_id in each Document")
#             upload_id = str(uuid.uuid4())
#             for doc in docs:
#                 doc.metadata["upload_id"] = upload_id
#             log.debug("Added upload_id in each Document")
#             
#             text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
#             splits = text_splitter.split_documents(docs)
#             log.info(f"Split documents into {len(splits)} chunks")
#
#             if is_url:
#                 source = self._strip_url_to_domain(source)
#             else:
#                 source = file_name
#
#             vector_store = await setup_vector_store(source)
#             await vector_store.aadd_documents(splits)
#
#             log.info(f"Successfully indexed {len(splits)} chunks from source: {source}")
#
#             return UploadResponse(
#                 id=upload_id,
#                 name=source
#             )
#
#         except Exception as e:
#             log.error(f"Error while indexing source '{source}': {e}", exc_info=True)
#             raise
#         finally:
#             if not is_url and source and os.path.exists(source):
#                 try:
#                     os.remove(source)
#                     log.info(f"Temp file deleted: {source}")
#                 except OSError as e:
#                     log.warning(f"Failed to delete temp file '{source}': {e}")
#                 
#
#     async def process_file_upload(self, file: UploadFile):
#         log.debug(f"Processing file upload: {file.filename}")
#         temp_path = None
#         
#         try:
#             with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as temp_file:
#                 shutil.copyfileobj(file.file, temp_file)
#                 temp_path = temp_file.name
#                 log.info(f"Temp file created at: {temp_path}")
#             
#             return await self.load_and_index(temp_path, is_url=False, file_name=file.filename)
#             
#         except Exception as e:
#             log.error(f"Error while processing file upload '{file.filename}': {e}", exc_info=True)
#             if temp_path and os.path.exists(temp_path):
#                 try:
#                     os.remove(temp_path)
#                     log.info(f"Cleaned up temp file after error: {temp_path}")
#                 except OSError as cleanup_error:
#                     log.warning(f"Failed to cleanup temp file '{temp_path}': {cleanup_error}")
#             raise
#
#
#     # async def summarize(self)
