import json
from fastapi import APIRouter, Request, Depends
from fastapi.responses import StreamingResponse

from src.agents.runner import runner
from src.schemas.bot import QuestionRequest
from src.api.dependencies import get_current_user


router = APIRouter(
    tags=["Chat Bot"]
)

@router.post("/chat_bot")
async def chat_bot_response(
    request: Request, 
    payload: QuestionRequest,
    user = Depends(get_current_user)
):
    try:
        async def generate_response():
            async for chunk in runner(
                workflow=request.app.state.chat_workflow,
                payload=payload,
                user_id=user.user_id
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

    except Exception as e:
        print("Error while prcessing the user request", str(e))
