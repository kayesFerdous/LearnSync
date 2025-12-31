from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (Boolean, 
    DateTime, 
    ForeignKey, 
    String, 
    UniqueConstraint, 
    func
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    username: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True,)
    given_name: Mapped[str] = mapped_column(String(150), nullable=False,)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False,)
    subscribed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False,)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False,)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(),)

    # Relationships
    identity: Mapped["UserIdentity"] = relationship(
        "UserIdentity",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

class UserIdentity(Base):
    __tablename__ = "user_identities"
    __table_args__ = (UniqueConstraint("provider", "external_sub"),)

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4,)

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    provider: Mapped[str] = mapped_column(String(50), nullable=False,)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True,) #INFO: only for email/password
    external_sub: Mapped[str] = mapped_column(String(255), nullable=False,)
    access_token: Mapped[str] = mapped_column(String, nullable=True,)
    refresh_token: Mapped[str | None] = mapped_column(String, nullable=True,)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True,)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="identity",
    )
