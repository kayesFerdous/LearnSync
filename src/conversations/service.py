from uuid import UUID, uuid4
from fastapi import HTTPException
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from src.conversations.model import Conversation, File, Folder, ProcessingStatus, FileType

async def create_conversation(
    db: AsyncSession, 
    user_id: UUID,
    folder_id: UUID | None = None
) -> str:
    new_conv = Conversation(
        user_id=user_id,
        folder_id=folder_id
    )
    db.add(new_conv)
    await db.commit()
    await db.refresh(new_conv)
    return str(new_conv.id)


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


async def update_conversation_title(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID,
    new_title: str
) -> Conversation | None:
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()

    if conversation:
        conversation.title = new_title
        await db.commit()
    
    return conversation


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


async def create_folder(
    db: AsyncSession,
    user_id: UUID,
    name: str,
    icon: str | None = None,
    color: str | None = None
) -> Folder:
    new_folder = Folder(
        user_id=user_id,
        name=name,
        icon=icon,
        color=color
    )
    db.add(new_folder)
    await db.commit()
    await db.refresh(new_folder)
    return new_folder

async def get_user_content(db: AsyncSession, user_id: UUID):
    # Fetch folders with conversations
    stmt_folders = (
        select(Folder)
        .options(selectinload(Folder.conversations))
        .where(Folder.user_id == user_id)
        .order_by(Folder.created_at.desc())
    )
    result_folders = await db.execute(stmt_folders)
    folders = result_folders.scalars().all()

    # Fetch root conversations (no folder)
    stmt_convs = (
        select(Conversation)
        .where(Conversation.user_id == user_id, Conversation.folder_id == None)
        .order_by(Conversation.updated_at.desc())
    )
    result_convs = await db.execute(stmt_convs)
    conversations = result_convs.scalars().all()

    return {
        "folders": folders,
        "conversations": conversations
    }


async def update_folder(
    db: AsyncSession,
    folder_id: UUID,
    user_id: UUID,
    name: str | None = None,
    icon: str | None = None,
    color: str | None = None
) -> Folder | None:
    stmt = select(Folder).where(
        Folder.id == folder_id,
        Folder.user_id == user_id
    )
    result = await db.execute(stmt)
    folder = result.scalar_one_or_none()

    if folder:
        if name is not None:
            folder.name = name
        if icon is not None:
            folder.icon = icon
        if color is not None:
            folder.color = color
        
        await db.commit()
    
    return folder


async def delete_folder(
    db: AsyncSession,
    folder_id: UUID,
    user_id: UUID
) -> bool:
    """
    Deletes a folder. 
    Due to 'ondelete=CASCADE' in the database model, this will automatically 
    delete all conversations and files contained within this folder.
    """
    result = await db.execute(
        delete(Folder)
        .where(
            Folder.id == folder_id,
            Folder.user_id == user_id
        )
    )
    await db.commit()

    return result.rowcount > 0


async def create_pending_file(
    db: AsyncSession,
    user_id: UUID,
    filename: str,
    file_path: str,
    folder_id: UUID | None = None,
    conversation_id: UUID | None = None,
    file_type: FileType = FileType.UNKNOWN
) -> File:
    """
    Creates a File record with PENDING status.
    """
    new_file = File(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        status=ProcessingStatus.PENDING,
        folder_id=folder_id,
        conversation_id=conversation_id,
        file_type=file_type
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    return new_file


async def get_file_status(
    db: AsyncSession,
    file_id: UUID,
    user_id: UUID
) -> File | None:
    """
    Retrieves a file by ID and user ID to check status.
    """
    stmt = select(File).where(File.id == file_id, File.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def cancel_upload(
    db: AsyncSession,
    file_id: UUID,
    user_id: UUID
) -> File | None:
    """
    Marks a file as CANCELLED.
    """
    stmt = select(File).where(File.id == file_id, File.user_id == user_id)
    result = await db.execute(stmt)
    file_record = result.scalar_one_or_none()
    
    if file_record:
        file_record.status = ProcessingStatus.CANCELLED
        await db.commit()
        await db.refresh(file_record)
        
    return file_record


async def get_folder_files(
    db: AsyncSession,
    folder_id: UUID,
    user_id: UUID
) -> list[File]:
    """
    Retrieves all files for a specific folder belonging to a user.
    Only loads columns needed for UI rendering.
    """
    # First verify the folder belongs to the user
    folder_stmt = select(Folder.id).where(
        Folder.id == folder_id,
        Folder.user_id == user_id
    )
    folder_result = await db.execute(folder_stmt)
    folder = folder_result.scalar_one_or_none()
    
    if not folder:
        return None  # Folder not found or doesn't belong to user
    
    # Get only needed columns for UI
    stmt = select(
        File.id,
        File.filename,
        File.file_type,
        File.status,
        File.created_at
    ).where(
        File.folder_id == folder_id
    ).order_by(File.created_at.desc())
    
    result = await db.execute(stmt)
    return result.all()


async def get_conversation_files(
    db: AsyncSession,
    conversation_id: UUID,
    user_id: UUID
) -> list[File]:
    """
    Retrieves all files for a specific conversation belonging to a user.
    Only loads columns needed for UI rendering.
    """
    # First verify the conversation belongs to the user
    conv_stmt = select(Conversation.id).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user_id
    )
    conv_result = await db.execute(conv_stmt)
    conversation = conv_result.scalar_one_or_none()
    
    if not conversation:
        return None  # Conversation not found or doesn't belong to user
    
    # Get only needed columns for UI
    stmt = select(
        File.id,
        File.filename,
        File.file_type,
        File.status,
        File.created_at
    ).where(
        File.conversation_id == conversation_id
    ).order_by(File.created_at.desc())
    
    result = await db.execute(stmt)
    return result.all()


async def delete_file(
    db: AsyncSession,
    file_id: UUID,
    user_id: UUID
) -> File | None:
    """
    Deletes a file record from the database.
    Returns the file record before deletion for cleanup operations,
    or None if the file doesn't exist or doesn't belong to the user.
    """
    # First fetch the file to verify ownership and get file_path for cleanup
    stmt = select(File).where(File.id == file_id, File.user_id == user_id)
    result = await db.execute(stmt)
    file_record = result.scalar_one_or_none()
    
    if not file_record:
        return None  # File not found or doesn't belong to user
    
    # Delete the file record
    await db.delete(file_record)
    await db.commit()
    
    return file_record
