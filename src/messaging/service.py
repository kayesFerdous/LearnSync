from datetime import datetime, timezone
from typing import Dict, List
from uuid import UUID
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, func
from sqlalchemy.orm import selectinload

from src.messaging.model import Message
from src.users.model import User


class ConnectionManager:
    """Manages active WebSocket connections per user."""

    def __init__(self):
        # user_id -> list of websockets (supports multiple tabs)
        self.active_connections: Dict[UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: UUID):
        try:
            await websocket.accept()
        except RuntimeError:
            pass  # Already accepted

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
            for connection in self.active_connections[user_id][:]:
                try:
                    await connection.send_json(message)
                except (RuntimeError, WebSocketDisconnect):
                    if user_id in self.active_connections and connection in self.active_connections[user_id]:
                        self.active_connections[user_id].remove(connection)


# Module-level singleton so all routes share the same manager
manager = ConnectionManager()

async def create_message(
    db: AsyncSession, 
    sender_id: UUID, 
    receiver_id: UUID, 
    content: str
) -> Message:
    new_message = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content
    )
    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)
    return new_message

async def get_chat_history(
    db: AsyncSession, 
    user_id_1: UUID, 
    user_id_2: UUID, 
    limit: int = 50, 
    offset: int = 0
) -> tuple[list[Message], int]:
    # Query for messages between the two users
    stmt = select(Message).where(
        or_(
            and_(Message.sender_id == user_id_1, Message.receiver_id == user_id_2),
            and_(Message.sender_id == user_id_2, Message.receiver_id == user_id_1)
        )
    ).order_by(desc(Message.created_at))
    
    # Get total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Get paginated messages
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    # Return reversed list (oldest first) for chat UI, but we queried newest first for pagination
    return list(reversed(messages)), total

async def get_recent_contacts(
    db: AsyncSession, 
    user_id: UUID
) -> list[dict]:
    # This is a simplified approach to get recent contacts.
    # We find distinct users the current user has interacted with.
    
    # Find IDs of users who sent messages to current user
    sent_to_me_stmt = select(Message.sender_id).where(Message.receiver_id == user_id)
    
    # Find IDs of users current user sent messages to
    sent_by_me_stmt = select(Message.receiver_id).where(Message.sender_id == user_id)
    
    # Combine and get unique IDs
    # Note: detailed SQL for "last message per user" is complex, 
    # so we'll fetch distinct IDs and then fetch details + last message for each.
    
    result_sent_to_me = await db.execute(sent_to_me_stmt)
    result_sent_by_me = await db.execute(sent_by_me_stmt)
    
    contact_ids = set(result_sent_to_me.scalars().all()) | set(result_sent_by_me.scalars().all())
    
    contacts = []
    
    for contact_id in contact_ids:
        # Get User details
        user_stmt = select(User).where(User.user_id == contact_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            continue
            
        # Get last message
        last_msg_stmt = select(Message).where(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == contact_id),
                and_(Message.sender_id == contact_id, Message.receiver_id == user_id)
            )
        ).order_by(desc(Message.created_at)).limit(1)
        
        last_msg_result = await db.execute(last_msg_stmt)
        last_msg = last_msg_result.scalar_one_or_none()
        
        # Count unread
        unread_stmt = select(func.count(Message.id)).where(
            Message.sender_id == contact_id,
            Message.receiver_id == user_id,
            Message.read_at == None
        )
        unread_result = await db.execute(unread_stmt)
        unread_count = unread_result.scalar_one()
        
        contacts.append({
            "user_id": user.user_id,
            "username": user.username,
            "email": user.email,
            "picture": user.picture,
            "last_message": last_msg,
            "unread_count": unread_count
        })
    
    # Sort by last message time
    contacts.sort(
        key=lambda x: x["last_message"].created_at if x["last_message"] else datetime.min, 
        reverse=True
    )
    
    return contacts

async def mark_messages_as_read(
    db: AsyncSession,
    sender_id: UUID,
    receiver_id: UUID
):
    # Mark all messages from sender_id to receiver_id as read
    stmt = select(Message).where(
        Message.sender_id == sender_id,
        Message.receiver_id == receiver_id,
        Message.read_at == None
    )
    result = await db.execute(stmt)
    unread_messages = result.scalars().all()
    
    if not unread_messages:
        return
        
    now = datetime.now(timezone.utc)
    for msg in unread_messages:
        msg.read_at = now
        
    await db.commit()
