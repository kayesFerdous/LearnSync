import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from src.agents.runner import runner
from src.schemas.bot import QuestionRequest


router = APIRouter(
    tags=["Chat Bot"]
)

@router.post("/chat_bot")
async def chat_bot_response(request: Request, payload: QuestionRequest):
    print(f"\npayload: {payload}\n\n")
    try:
        async def generate_response():
            async for chunk in runner(
                workflow=request.app.state.chat_workflow,
                query=payload.message,
                tag=payload.tag
            ):
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
