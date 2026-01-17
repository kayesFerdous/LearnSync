import json
from typing import List
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.runner import runner
from src.api.conversations.schemas import ConversationRequest, ConversationResponse
from src.api.dependencies import get_current_user
from src.db.session import get_db
from src.conversations.service import create_conversation, get_conversation, get_user_conversations


router = APIRouter(
    prefix="/conversation",
    tags=["Conversations"]
)

@router.post("/")
@router.post("/{conversation_id}")
async def initiate_conversation(
    request: Request,
    payload: ConversationRequest,
    conversation_id: str | None = None,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        if conversation_id:
            thread_id = conversation_id
            send_metadata_header = False
        else: 
            thread_id = await create_conversation(db, user.user_id)
            send_metadata_header = True

        async def generate_response():
            if send_metadata_header:
                setup_packet = {
                    "type": "conversation_id",
                    "payload": thread_id,
                }
                yield f"data: {json.dumps(jsonable_encoder(setup_packet))}\n\n"

            async for chunk in runner(
                workflow=request.app.state.chat_workflow,
                payload=payload,
                thread_id=str(thread_id),
                user_id=user.user_id,
                db=db
            ):
                yield f"data: {json.dumps(jsonable_encoder(chunk))}\n\n"

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

@router.get("/", response_model=List[ConversationResponse])
async def list_conversations(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_user_conversations(db, user.user_id)

@router.get("/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    request: Request,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uuid_id = conversation_id
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    conversation = await get_conversation(db, uuid_id, user.user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    config = {"configurable": {"thread_id": str(conversation_id)}}
    state = await request.app.state.chat_workflow.aget_state(config)
    
    if not state.values:
        return []
        
    return state.values.get("messages", [])
