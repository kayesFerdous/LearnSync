from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
from uuid import UUID
import json
from datetime import datetime

from src.db.session import get_db
from src.users.model import User
from src.users.crud import get_user_by_id
from src.auth.service import decode_access_token
from src.core.config import settings
from src.api.dependencies import get_current_user

from src.messaging.service import create_message, get_chat_history, get_recent_contacts, mark_messages_as_read
from src.api.messaging.schemas import MessageCreate, MessageResponse, ChatHistoryResponse, ContactResponse

router = APIRouter(prefix="/messaging", tags=["Messaging"])

class ConnectionManager:
    def __init__(self):
        # user_id -> list of websockets
        self.active_connections: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID):
        try:
            # Check if connection is already accepted
            # websocket.client_state is getting trickier to check directly in recent Starlette, 
            # but usually we should call accept(). If already accepted, it might error.
            # Safe to call accept() here.
            await websocket.accept()
        except RuntimeError:
            pass # Already accepted
            
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: UUID):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: UUID):
        if user_id in self.active_connections:
            # Send to all active connections for this user (e.g. multiple tabs)
            # Iterate over a copy to safe remove if needed
            for connection in self.active_connections[user_id][:]:
                try:
                    await connection.send_json(message)
                except (RuntimeError, WebSocketDisconnect):
                    # Connection likely closed
                    if user_id in self.active_connections and connection in self.active_connections[user_id]:
                        self.active_connections[user_id].remove(connection)

manager = ConnectionManager()

async def get_current_user_ws(
    websocket: WebSocket,
    db: AsyncSession
) -> User:
    token = websocket.cookies.get(settings.COOKIE_NAME)
    # Also check query param for flexibility
    if not token:
        token = websocket.query_params.get("token")
        
    if not token:
        # We can't close here if we want to return None/raise, standard pattern for dependency
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    try:
        user_id = await decode_access_token(token)
        user = await get_user_by_id(user_id, db)
        if not user:
             raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")

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
                print(f"WS Error processing message: {e}")
                
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
