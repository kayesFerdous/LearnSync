"""add status to files

Revision ID: cf61986423a1
Revises: cd18245b619a
Create Date: 2026-01-31 12:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cf61986423a1'
down_revision: Union[str, None] = 'cd18245b619a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type first. We need to handle 'checkfirst' carefully.
    # In PostgreSQL, enums are types.
    connection = op.get_bind()
    processing_status = sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='processingstatus')
    
    # Check if type exists (Postgres specific check usually, but Alembic can handle create if not exists)
    # Ideally for portability, we just try to create it, but 'checkfirst' isn't standard in raw SQL generation.
    # We'll use a safer pattern for Postgres Enums:
    try:
        processing_status.create(connection)
    except Exception:
        # Assuming it exists if creation fails (e.g. reused from deleted document table)
        pass

    # Add columns to files table
    # Note: We must supply the enum object itself for the column type
    op.add_column('files', sa.Column('status', processing_status, nullable=False, server_default='PENDING'))
    op.add_column('files', sa.Column('error_message', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('files', 'error_message')
    op.drop_column('files', 'status')
    
    connection = op.get_bind()
    processing_status = sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='processingstatus')
    
    try:
        processing_status.drop(connection)
    except Exception:
        pass
