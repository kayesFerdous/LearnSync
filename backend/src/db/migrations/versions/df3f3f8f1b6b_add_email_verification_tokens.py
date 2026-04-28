"""add email verification tokens

Revision ID: df3f3f8f1b6b
Revises: 7661ac79838f
Create Date: 2026-02-19 12:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "df3f3f8f1b6b"
down_revision: Union[str, Sequence[str], None] = "7661ac79838f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_identities",
        sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "user_identities",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "email_verification_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("identity_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["identity_id"],
            ["user_identities.id"],
            name=op.f("fk_email_verification_tokens_identity_id_user_identities"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_email_verification_tokens")),
    )
    op.create_index(
        op.f("ix_email_verification_tokens_identity_id"),
        "email_verification_tokens",
        ["identity_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_email_verification_tokens_token_hash"),
        "email_verification_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        op.f("ix_email_verification_tokens_expires_at"),
        "email_verification_tokens",
        ["expires_at"],
        unique=False,
    )

    op.execute(
        sa.text(
            """
            UPDATE user_identities
            SET is_email_verified = true,
                email_verified_at = COALESCE(email_verified_at, NOW())
            WHERE is_email_verified = false
            """
        )
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_email_verification_tokens_expires_at"), table_name="email_verification_tokens")
    op.drop_index(op.f("ix_email_verification_tokens_token_hash"), table_name="email_verification_tokens")
    op.drop_index(op.f("ix_email_verification_tokens_identity_id"), table_name="email_verification_tokens")
    op.drop_table("email_verification_tokens")

    op.drop_column("user_identities", "email_verified_at")
    op.drop_column("user_identities", "is_email_verified")
