from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
from enum import Enum
from sqlalchemy import (
    DateTime, 
    ForeignKey, 
    String, 
    Text,
    func,
    Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class FileType(str, Enum):
    # Document formats
    PDF = "pdf"
    DOCX = "docx"
    PPTX = "pptx"
    XLSX = "xlsx"
    HTML = "html"
    MARKDOWN = "markdown"
    # Image formats
    PNG = "png"
    JPEG = "jpeg"
    TIFF = "tiff"
    # Audio formats (ASR support)
    WAV = "wav"
    MP3 = "mp3"
    # Video text tracks
    VTT = "vtt"
    # Web content
    URL = "url"
    # Fallback
    UNKNOWN = "unknown"

class Folder(Base):
    __tablename__ = "folders"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(255), nullable=True)
    color: Mapped[str] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("src.users.model.User") #type: ignore
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="folder")
    files: Mapped[List["File"]] = relationship("File", back_populates="folder")


class Conversation(Base):
    __tablename__ = "conversations"

    # This ID will be used as the LangGraph thread_id
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    folder_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="New Conversation")
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), 
        onupdate=func.now(),
        server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("src.users.model.User") #type: ignore
    folder: Mapped[Optional["Folder"]] = relationship("Folder", back_populates="conversations")
    files: Mapped[List["File"]] = relationship("File", back_populates="conversation")


class File(Base):
    __tablename__ = "files"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    conversation_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    folder_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False) # S3 path
    file_type: Mapped[FileType] = mapped_column(
        SQLEnum(FileType), 
        default=FileType.UNKNOWN, 
        nullable=False
    )
    
    # Status tracking
    status: Mapped[ProcessingStatus] = mapped_column(
        SQLEnum(ProcessingStatus), 
        default=ProcessingStatus.PENDING, 
        nullable=False
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Metadata for RAG
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    topics: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String), nullable=True)
    doc_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("src.users.model.User") #type: ignore
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="files")
    folder: Mapped[Optional["Folder"]] = relationship("Folder", back_populates="files")


class Mindmap(Base):
    __tablename__ = "mindmaps"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Either folder_id or conversation_id will be set, not both
    folder_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    conversation_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    
    # Store the mindmap as JSON
    mindmap_data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("src.users.model.User") #type: ignore
    folder: Mapped[Optional["Folder"]] = relationship("Folder")
    conversation: Mapped[Optional["Conversation"]] = relationship("Conversation")
