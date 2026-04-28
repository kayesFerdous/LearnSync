from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=True) # E.g. "Quiz on Python"
    difficulty: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    
    source_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # file, folder, conversation
    source_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    score: Mapped[Optional[int]] = mapped_column(nullable=True)

    # Foreign Keys for direct association
    folder_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    conversation_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), nullable=True, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    questions: Mapped[List["QuizQuestion"]] = relationship(back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    quiz_id: Mapped[UUID] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(50), default="MCQ")
    
    # Store options and answers as JSON for flexibility
    # Structure: 
    # options: [{"id": 1, "text": "A"}, ...]
    # answers: [1]
    options: Mapped[dict] = mapped_column(JSON, nullable=False)  
    answers: Mapped[List[int]] = mapped_column(JSON, nullable=False) 
    
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reference_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reference_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    quiz: Mapped["Quiz"] = relationship(back_populates="questions")
