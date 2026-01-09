#NOTE: This is the old version. This file is not being used. 

# from fastapi import Request
# from src.services.text_editor_service import TextEditor
#
# def get_bot(request: Request) -> ChatBot:
#     return request.app.state.bot
#
#
# _text_editor: TextEditor | None = None
#
# async def get_text_editor() -> TextEditor:
#     global _text_editor
#
#     if _text_editor is None:
#         _text_editor = await TextEditor.init() 
#     return _text_editor
