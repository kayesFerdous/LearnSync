from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4
from sqlalchemy import String, Boolean, Enum as SQLEnum, Text, ForeignKey, func, DateTime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    
    # Metadata
    filename: Mapped[str | None] = mapped_column(String, nullable=True) # Original filename or None for URLs
    source: Mapped[str] = mapped_column(String, nullable=False) # Object Key or URL
    is_url: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Status tracking
    status: Mapped[ProcessingStatus] = mapped_column(
        SQLEnum(ProcessingStatus), 
        default=ProcessingStatus.PENDING, 
        nullable=False
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), 
        onupdate=func.now()
    )

    # Relationships
    # user: Mapped["User"] = relationship("User", back_populates="documents")
