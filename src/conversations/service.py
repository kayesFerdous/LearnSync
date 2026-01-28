from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from src.conversations.model import Conversation, File

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


async def get_available_files_for_chat(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
):
    # Step 1: Query the conversation to check folder status
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Step 2: Determine file scope based on folder_id
    if conversation.folder_id:
        # Course Mode: Fetch all files linked to this folder
        stmt = select(File).where(File.folder_id == conversation.folder_id)
    else:
        # Private Mode: Fetch only files linked to this conversation
        stmt = select(File).where(File.conversation_id == conversation_id)

    result = await db.execute(stmt)
    return result.scalars().all()