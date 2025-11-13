from fastapi import APIRouter, Depends
import json
from fastapi.responses import StreamingResponse

from src.workflows.chat_workflow import ChatBot
# from src.services.llm_service import setup_prompt_template, setup_groq_llm
from src.schemas.bot import QuestionRequest
from src.api.dependencies import get_bot


router = APIRouter(
    prefix="/api/bot",
    tags=["Bot"]
)


@router.post("/stream")
async def stream_response(request:QuestionRequest, chatbot: ChatBot = Depends(get_bot)):
    # response = await chatbot.run(request.question):
    # print(response)
    try:
        async def generate_response():
            async for chunk in chatbot.run(request.question):
                yield f"data: {json.dumps(chunk)}\n\n"

        return StreamingResponse(
                generate_response(),
                media_type="text/event-stream",  # Important for SSE
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                }
            )

    except:
        print("Error while prcessing the user request")
