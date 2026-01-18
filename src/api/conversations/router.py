import json
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, Depends, Response
from fastapi.responses import StreamingResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.runner import runner
from src.api.conversations.schemas import ConversationRequest, ConversationResponse
from src.api.dependencies import get_current_user
from src.db.session import get_db
from src.conversations.service import create_conversation, get_conversation, get_user_conversations, remove_conversation


router = APIRouter(
    prefix="/conversation",
    tags=["Conversations"]
)

@router.post("/")
@router.post("/{conversation_id}")
async def chat(
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
            thread_id: str = await create_conversation(db, user.user_id)
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
                thread_id=thread_id,
                user_id=str(user.user_id),
                db=db
            ):
                yield f"data: {json.dumps(jsonable_encoder(chunk))}\n\n"

        return StreamingResponse(
                generate_response(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                }
            )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error while processing the user request: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=List[ConversationResponse])
async def get_conversations(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_user_conversations(db, user.user_id)


@router.get("/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    request: Request,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uuid_id = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")

    conversation = await get_conversation(db, uuid_id, user.user_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    config = {"configurable": {"thread_id": conversation_id}}
    state = await request.app.state.chat_workflow.aget_state(config)
    
    if not state.values:
        return []
        
    return state.values.get("messages", [])


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    request: Request,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uuid_id = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")

    if not await remove_conversation(db, uuid_id, user.user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    try:
        workflow = request.app.state.chat_workflow
        if hasattr(workflow.checkpointer, "adelete_thread"):
            await workflow.checkpointer.adelete_thread(thread_id=conversation_id)
    except Exception as e:
        print(f"Error deleting workflow state for thread {conversation_id}: {str(e)}")

    return Response(status_code=204)
