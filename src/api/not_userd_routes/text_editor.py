# from fastapi import APIRouter, Depends
#
# from src.core.logging_config import get_logger
# from src.api.dependencies import get_text_editor
# from src.schemas.text_editor import TextConvertionRequest
# from src.services.text_editor_service import TextEditor
#
# log = get_logger(__name__)
#
# router = APIRouter(
#     prefix="/api/text-editor",
#     tags=["Text Editor"]
# )
#
# @router.post("/convert")
# async def convert_text(request: TextConvertionRequest, text_editor: TextEditor = Depends(get_text_editor)) -> str | None:
#     try:
#         converted_text = await text_editor.convert(request.text)
#         log.info(f"converted text: {converted_text}")
#         return converted_text
#     except Exception as e:
#         log.error(f"Error while converting text: {str(e)}")
#
