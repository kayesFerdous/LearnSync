from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional

from src.documents.model import Document, ProcessingStatus

async def create_document(
    db: AsyncSession, 
    user_id: UUID, 
    source: str, 
    is_url: bool, 
    filename: Optional[str] = None
) -> Document:
    """
    Creates a new document record with status PENDING.
    """
    db_obj = Document(
        user_id=user_id,
        source=source,
        is_url=is_url,
        filename=filename,
        status=ProcessingStatus.PENDING
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_document_by_id(db: AsyncSession, document_id: UUID) -> Optional[Document]:
    """
    Retrieves a document by its ID.
    """
    result = await db.execute(select(Document).where(Document.id == document_id))
    return result.scalar_one_or_none()

async def get_user_documents(db: AsyncSession, user_id: UUID) -> List[Document]:
    """
    Retrieves all documents for a specific user, ordered by creation time.
    """
    result = await db.execute(
        select(Document)
        .where(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())

async def update_document_status(
    db: AsyncSession, 
    document_id: UUID, 
    status: ProcessingStatus,
    error_message: Optional[str] = None
) -> Optional[Document]:
    """
    Updates the status and error message of a document.
    """
    stmt = (
        update(Document)
        .where(Document.id == document_id)
        .values(
            status=status,
            error_message=error_message
        )
        .returning(Document)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.scalar_one_or_none()
