from uuid import UUID
from sqlalchemy import select, delete
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


async def get_user_conversations(db: AsyncSession, user_id: UUID):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
    )
    return result.scalars().all()


async def get_conversation(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> Conversation | None:
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def remove_conversation(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> bool:
    result = await db.execute(
        delete(Conversation)
        .where(
            Conversation.user_id == user_id,
            Conversation.id == conversation_id
        )
    )
    await db.commit()

    return result.rowcount > 0
