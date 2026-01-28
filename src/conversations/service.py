from uuid import UUID, uuid4
from fastapi import HTTPException, UploadFile
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


async def upload_and_process_file(
    db: AsyncSession,
    user_id: UUID,
    conversation_id: UUID,
    file: UploadFile
) -> File:
    """
    Handles file upload, scope determination, AI processing, and DB insertion.
    """
    # 1. Check Scope / Get Folder ID
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    folder_id = conversation.folder_id
    
    # 2. Upload to S3 (Mocked)
    file_path = await _upload_file_to_storage(file)
    
    # 3. AI Extraction (Mocked)
    # In a real scenario, we would read the file content here.
    # content = await file.read()
    # For now, we simulate extraction.
    metadata = await _extract_metadata_with_gemini("mock_text_content")
    
    # 4. Database Insert
    new_file = File(
        user_id=user_id,
        conversation_id=conversation_id,
        folder_id=folder_id,
        filename=file.filename or "unknown_file",
        file_path=file_path,
        summary=metadata.get("summary"),
        topics=metadata.get("topics", []),
        doc_type=metadata.get("doc_type")
    )
    
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    
    return new_file


async def _upload_file_to_storage(file: UploadFile) -> str:
    # Mocking S3 upload
    return f"s3://bucket/uploads/{uuid4()}/{file.filename}"


async def _extract_metadata_with_gemini(text: str) -> dict:
    # Mocking LLM extraction
    return {
        "summary": "This is a comprehensive study guide covering the fundamental principles of Physics 101, including Newton's laws and kinematics.",
        "topics": ["Physics", "Kinematics", "Newton's Laws"],
        "doc_type": "Lecture Notes"
    }
