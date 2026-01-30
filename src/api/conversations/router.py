import json
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, Depends, Response
from fastapi.responses import StreamingResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.runner import runner
from src.api.conversations.schemas import ConversationRequest, FolderCreate, FolderResponse, ConversationListResponse
from src.api.dependencies import get_current_user
from src.db.session import get_db
from src.conversations.service import create_conversation, get_conversation, get_user_content, remove_conversation, create_folder


router = APIRouter(
    prefix="/conversation",
    tags=["Conversations"]
)

@router.post("/folder", response_model=FolderResponse)
async def create_new_folder(
    folder: FolderCreate,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new folder for organizing conversations and files.
    """
    return await create_folder(db, user.user_id, folder.name, folder.icon, folder.color)


async def stream_generator(
    request: Request,
    payload: ConversationRequest,
    thread_id: str,
    user_id: str,
    db: AsyncSession,
    send_metadata_header: bool = False
):
    """
    Shared generator for streaming chat responses.
    """
    if send_metadata_header:
        setup_packet = {
            "type": "conversation_id",
            "payload": thread_id,
        }
        yield f"data: {json.dumps(jsonable_encoder(setup_packet))}\n\n"

    try:
        async for chunk in runner(
            workflow=request.app.state.chat_workflow,
            payload=payload,
            thread_id=thread_id,
            user_id=user_id,
            db=db
        ):
            yield f"data: {json.dumps(jsonable_encoder(chunk))}\n\n"
    except Exception as e:
        print(f"Error in chat stream: {str(e)}")
        error_packet = {"type": "error", "payload": "Stream interrupted"}
        yield f"data: {json.dumps(jsonable_encoder(error_packet))}\n\n"


@router.post("/")
async def create_conversation_chat(
    request: Request,
    payload: ConversationRequest,
    folder_id: str | None = None,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new conversation and streams the first response.
    Optional 'folder_id' query param to assign the conversation to a folder.
    """
    try:
        print("folder er under a new conversation create hoise")
        parsed_folder_id = UUID(folder_id) if folder_id else None
        # Create the conversation in the DB first
        thread_id: str = await create_conversation(db, user.user_id, parsed_folder_id)
        
        return StreamingResponse(
            stream_generator(request, payload, thread_id, str(user.user_id), db, send_metadata_header=True),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
    except Exception as e:
        print(f"Error creating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{conversation_id}")
async def continue_conversation_chat(
    conversation_id: str,
    request: Request,
    payload: ConversationRequest,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Continues an existing conversation.
    """
    try:
        # Security Check: Ensure conversation exists and belongs to the user
        try:
            conversation_uuid = UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation ID format")

        conversation = await get_conversation(db, conversation_uuid, user.user_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return StreamingResponse(
            stream_generator(request, payload, conversation_id, str(user.user_id), db, send_metadata_header=False),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            }
        )
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/", response_model=ConversationListResponse)
async def get_conversations(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns a structured list of folders (with their conversations) 
    and root-level conversations.
    """
    return await get_user_content(db, user.user_id)


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
