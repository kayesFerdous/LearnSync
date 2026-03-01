from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
import json

from src.db.session import get_db
from src.users.model import User
from src.api.dependencies import get_current_user, get_current_user_ws

from src.messaging.service import create_message, get_chat_history, get_recent_contacts, mark_messages_as_read, manager
from src.api.messaging.schemas import MessageCreate, MessageResponse, ChatHistoryResponse, ContactResponse
from src.core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/messaging", tags=["Messaging"])

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db)
):
    # Verify user
    try:
        user = await get_current_user_ws(websocket, db)
    except HTTPException:
        # Reject connection
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(websocket, user.user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            # We expect JSON with "receiver_id" and "content"
            try:
                payload = json.loads(data)
                
                # Check for heartbeat/ping
                if payload.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                    continue
                    
                receiver_id_str = payload.get("receiver_id")
                content = payload.get("content")
                
                if not receiver_id_str or not content:
                    continue
                
                try:
                    receiver_id = UUID(receiver_id_str)
                except ValueError:
                    continue
                    
                # Save message
                msg = await create_message(db, user.user_id, receiver_id, content)
                
                # Prepare response
                response = {
                    "type": "new_message",
                    "id": str(msg.id),
                    "sender_id": str(msg.sender_id),
                    "receiver_id": str(msg.receiver_id),
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat(),
                    "read_at": None
                }
                
                # Send to receiver (real-time)
                await manager.send_personal_message(response, receiver_id)
                
                # Send back to sender (confirmation/update UI)
                await manager.send_personal_message(response, user.user_id)
                
            except json.JSONDecodeError:
                pass
            except Exception as e:
                logger.error(f"WS Error processing message: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.user_id)
        
@router.post("/send", response_model=MessageResponse)
async def send_message(
    message: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    msg = await create_message(db, user.user_id, message.receiver_id, message.content)
    
    # Notify receiver via WS if connected
    response = {
        "type": "new_message",
        "id": str(msg.id),
        "sender_id": str(msg.sender_id),
        "receiver_id": str(msg.receiver_id),
        "content": msg.content,
        "created_at": msg.created_at.isoformat(),
        "read_at": None
    }
    await manager.send_personal_message(response, message.receiver_id)
    
    # Also notify sender via WS if they have other tabs open
    # await manager.send_personal_message(response, user.user_id)
    
    return msg

@router.get("/history/{user_id}", response_model=ChatHistoryResponse)
async def get_history(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        other_user_id = UUID(user_id)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid user ID")
         
    messages, total = await get_chat_history(db, user.user_id, other_user_id, limit, offset)
    
    # Helper to serialize if Pydantic doesn't automatically (it should with generic model)
    return {"messages": messages, "total_count": total}

@router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_recent_contacts(db, user.user_id)

@router.post("/read/{sender_id}")
async def mark_read(
    sender_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        sender_uuid = UUID(sender_id)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid user ID")
         
    await mark_messages_as_read(db, sender_uuid, user.user_id)
    return {"status": "success"}
