"""add cancelled status to enum

Revision ID: 9f9ab3f598e3
Revises: 8a45e7b29a1c
Create Date: 2026-01-31 17:04:20.281673

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9f9ab3f598e3'
down_revision: Union[str, None] = 'cf61986423a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update the Enum Type safely
    op.execute("""
        DO $$
        BEGIN
            ALTER TYPE processingstatus ADD VALUE IF NOT EXISTS 'CANCELLED';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # 2. Drop the legacy 'documents' table if it exists (cleanup)
    # Using check to be safe
    op.execute("""
        DROP TABLE IF EXISTS documents CASCADE;
    """)


def downgrade() -> None:
    # We cannot easily remove value from Enum in Postgres without recreating type.
    # We will just leave 'CANCELLED' in the enum.
    
    # Restore 'documents' table if needed (simplified schema for downgrade)
    op.create_table('documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('filename', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('is_url', sa.Boolean(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', name='processingstatus'), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_documents'))
    )