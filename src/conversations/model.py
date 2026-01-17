from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import (
    DateTime, 
    ForeignKey, 
    String, 
    func
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

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

    # Relationship
    user: Mapped["User"] = relationship("src.users.model.User") #type: ignore
