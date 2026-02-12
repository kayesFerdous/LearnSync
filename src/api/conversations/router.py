import json
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request, Depends, Response, Query, Body
from fastapi.responses import StreamingResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.ext.asyncio import AsyncSession

from src.agents.runner import runner
from src.api.conversations.schemas import (
    ConversationRequest, 
    FolderCreate, 
    FolderResponse, 
    FolderUpdate,
    ConversationListResponse, 
    ConversationUpdate,
    ConversationResponse
)
from src.api.conversations.mindmap_schemas import MindmapResponse, MindmapNodeResponse, MindmapCreateRequest
from src.services.mindmap_service import generate_folder_mindmap, generate_conversation_mindmap, get_saved_mindmap
from src.api.dependencies import get_current_user
from src.db.session import get_db
from src.conversations.service import (
    create_conversation, 
    get_conversation, 
    get_user_content, 
    remove_conversation, 
    create_folder,
    update_conversation_title,
    update_folder,
    delete_folder
)


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
    send_metadata_header: bool = False,
    folder_id: str | None = None,
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
            db=db,
            folder_id=folder_id,
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
            stream_generator(request, payload, thread_id, str(user.user_id), db, send_metadata_header=True, folder_id=folder_id),
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

        # Get folder_id from the existing conversation if it belongs to one
        conv_folder_id = str(conversation.folder_id) if hasattr(conversation, 'folder_id') and conversation.folder_id else None
        
        return StreamingResponse(
            stream_generator(request, payload, conversation_id, str(user.user_id), db, send_metadata_header=False, folder_id=conv_folder_id),
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


@router.patch("/{conversation_id}")
async def rename_conversation(
    conversation_id: str,
    update_data: ConversationUpdate,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uuid_id = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")

    updated_conversation = await update_conversation_title(db, uuid_id, user.user_id, update_data.title)
    
    if not updated_conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    return {"status": "success"}


@router.patch("/folder/{folder_id}")
async def update_existing_folder(
    folder_id: str,
    update_data: FolderUpdate,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uuid_id = UUID(folder_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")

    updated_folder = await update_folder(
        db, 
        uuid_id, 
        user.user_id, 
        update_data.name, 
        update_data.icon, 
        update_data.color
    )
    
    if not updated_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
        
    return {"status": "success"}


@router.delete("/folder/{folder_id}", status_code=204)
async def delete_existing_folder(
    folder_id: str,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        uuid_id = UUID(folder_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")

    if not await delete_folder(db, uuid_id, user.user_id):
        raise HTTPException(status_code=404, detail="Folder not found")
    
    return Response(status_code=204)


@router.post("/folder/{folder_id}/mindmap", response_model=MindmapResponse)
async def generate_folder_mindmap_endpoint(
    folder_id: str,
    request: Request,
    body: MindmapCreateRequest = Body(default_factory=MindmapCreateRequest),
    force_regenerate: bool = Query(False),
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a mindmap for all files in a folder.
    
    This endpoint aggregates all files within a folder and uses an LLM
    to generate a hierarchical mindmap structure showing relationships
    and themes across the files.
    
    Args:
        folder_id: UUID of the folder
        
    Returns:
        MindmapResponse with the hierarchical mindmap structure
        
    Raises:
        404: Folder not found or doesn't belong to user
        500: Error during mindmap generation
    """
    try:
        uuid_id = UUID(folder_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")
    
    try:
        # Get the Gemini LLM from app state
        gemini_llm = request.app.state.gemini_llm_temp_0
        
        # Parse file_ids
        file_uuids = []
        if body and body.file_ids:
            try:
                file_uuids = [UUID(fid) for fid in body.file_ids]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        # Generate the mindmap
        mindmap = await generate_folder_mindmap(db, uuid_id, user.user_id, gemini_llm, force_regenerate, file_ids=file_uuids)
        
        if mindmap is None:
            raise HTTPException(status_code=404, detail="Folder not found")
        
        # Convert to response format
        return MindmapResponse(
            root=MindmapNodeResponse(**mindmap.model_dump()),
            total_files=mindmap.metadata.get("file_count", 0),
            generated_at=datetime.utcnow(),
            context=mindmap.title
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating folder mindmap: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating mindmap")


@router.post("/{conversation_id}/mindmap", response_model=MindmapResponse)
async def generate_conversation_mindmap_endpoint(
    conversation_id: str,
    request: Request,
    body: MindmapCreateRequest = Body(default_factory=MindmapCreateRequest),
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a mindmap for all files in a conversation.
    
    This endpoint aggregates all files within a conversation and uses an LLM
    to generate a hierarchical mindmap structure showing relationships
    and themes across the files.
    
    Args:
        conversation_id: UUID of the conversation
        
    Returns:
        MindmapResponse with the hierarchical mindmap structure
        
    Raises:
        404: Conversation not found or doesn't belong to user
        500: Error during mindmap generation
    """
    try:
        uuid_id = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")
    
    try:
        # Get the Gemini LLM from app state
        gemini_llm = request.app.state.gemini_llm_temp_0
        
        # Parse file_ids
        file_uuids = []
        if body and body.file_ids:
            try:
                file_uuids = [UUID(fid) for fid in body.file_ids]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        # Generate the mindmap
        mindmap = await generate_conversation_mindmap(db, uuid_id, user.user_id, gemini_llm, file_ids=file_uuids)
        
        if mindmap is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Convert to response format
        return MindmapResponse(
            root=MindmapNodeResponse(**mindmap.model_dump()),
            total_files=mindmap.metadata.get("file_count", 0),
            generated_at=datetime.utcnow(),
            context=mindmap.title
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating conversation mindmap: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating mindmap")


@router.get("/folder/{folder_id}/mindmap", response_model=MindmapResponse)
async def get_folder_mindmap_endpoint(
    folder_id: str,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the saved mindmap for a folder.
    
    Returns the cached mindmap if available, otherwise returns 404.
    Use POST endpoint to generate a new mindmap.
    
    Args:
        folder_id: UUID of the folder
        
    Returns:
        MindmapResponse with the saved mindmap structure
        
    Raises:
        404: No saved mindmap found for this folder
    """
    try:
        uuid_id = UUID(folder_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid folder ID format")
    
    try:
        mindmap = await get_saved_mindmap(db, user.user_id, folder_id=uuid_id)
        
        if mindmap is None:
            raise HTTPException(status_code=404, detail="No saved mindmap found for this folder")
        
        return MindmapResponse(
            root=MindmapNodeResponse(**mindmap.model_dump()),
            total_files=mindmap.metadata.get("file_count", 0),
            generated_at=datetime.utcnow(),
            context=mindmap.title
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving folder mindmap: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving mindmap")


@router.get("/{conversation_id}/mindmap", response_model=MindmapResponse)
async def get_conversation_mindmap_endpoint(
    conversation_id: str,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the saved mindmap for a conversation.
    
    Returns the cached mindmap if available, otherwise returns 404.
    Use POST endpoint to generate a new mindmap.
    
    Args:
        conversation_id: UUID of the conversation
        
    Returns:
        MindmapResponse with the saved mindmap structure
        
    Raises:
        404: No saved mindmap found for this conversation
    """
    try:
        uuid_id = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")
    
    try:
        mindmap = await get_saved_mindmap(db, user.user_id, conversation_id=uuid_id)
        
        if mindmap is None:
            raise HTTPException(status_code=404, detail="No saved mindmap found for this conversation")
        
        return MindmapResponse(
            root=MindmapNodeResponse(**mindmap.model_dump()),
            total_files=mindmap.metadata.get("file_count", 0),
            generated_at=datetime.utcnow(),
            context=mindmap.title
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving conversation mindmap: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving mindmap")
