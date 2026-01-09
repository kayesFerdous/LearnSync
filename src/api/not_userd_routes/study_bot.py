# from fastapi import APIRouter, UploadFile
#
# from src.schemas.study_bot import URLUploadequest, UploadResponse
# from src.services.study_bot import StudyBot
# from src.core.logging_config import get_logger
#
#
# log = get_logger(__name__)
#
# router = APIRouter(
#     prefix="/api/study_bot",
#     tags=["StudyBot"]
# )
#
# @router.post("/upload_url", response_model=UploadResponse)
# async def upload_url(request: URLUploadequest):
#     log.debug("Initializing StudyBot class")
#     study_bot = await StudyBot.init()
#     log.debug("Initialized StudyBot class")
#     try:
#         return await study_bot.load_and_index(request.url, is_url=True)
#     except Exception as e:
#         log.error(f"Error: {e}", exc_info=True)
#         raise
#
#     
# @router.post("/upload_file", response_model=UploadResponse)
# async def upload_file(file: UploadFile):
#     log.debug("Initializing StudyBot class")
#     study_bot = await StudyBot.init()
#     log.debug("Initialized StudyBot class")
#     try:
#         return await study_bot.process_file_upload(file)
#     except Exception as e:
#         log.error(f"Error: {e}", exc_info=True)
#         raise
#
#
# @router.get("/{source_id}")
# async def get_mcqs(source_id: str):
#     pass
