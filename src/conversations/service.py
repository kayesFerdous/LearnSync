from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.conversations.model import Conversation

async def create_conversation(db: AsyncSession, user_id: UUID) -> str:
    new_conv = Conversation(
        user_id=user_id,
    )
    db.add(new_conv)
    await db.commit()
    await db.refresh(new_conv)
    return str(new_conv.id)


async def get_user_conversations(db: AsyncSession, user_id: str):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()

async def get_conversation(
    db: AsyncSession,
    conversation_id: str,
    user_id: str
) -> Conversation | None:
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
    )
    return result.scalar_one_or_none()
