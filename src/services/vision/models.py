from datetime import datetime
from uuid import UUID, uuid4
from typing import List

from sqlalchemy import (
    DateTime, 
    ForeignKey, 
    String, 
    func
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

class Routine(Base):
    __tablename__ = "routines"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String, default="Weekly Class Schedule")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    classes: Mapped[List["ClassSession"]] = relationship(
        "ClassSession",
        back_populates="routine",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    routine_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("routines.id", ondelete="CASCADE"),
        nullable=False
    )
    day: Mapped[str] = mapped_column(String, nullable=False)
    start_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    course_name: Mapped[str] = mapped_column(String, nullable=False)

    # Relationships
    routine: Mapped["Routine"] = relationship(
        "Routine",
        back_populates="classes"
    )