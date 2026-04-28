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
down_revision: Union[str, None] = 'b60c7e15ef05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the enum type safely using raw SQL to handle existence check within the transaction.
    # This avoids "current transaction is aborted" errors if we use try/except on sa.Enum.create().
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processingstatus') THEN
                CREATE TYPE processingstatus AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
            END IF;
        END $$;
    """)

    # Define the Enum object for the column definition (SQLAlchemy needs this metadata)
    processing_status = sa.Enum('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', name='processingstatus')

    # Add columns to files table
    op.add_column('files', sa.Column('status', processing_status, nullable=False, server_default='PENDING'))
    op.add_column('files', sa.Column('error_message', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('files', 'error_message')
    op.drop_column('files', 'status')
    
    # Safe drop of the enum type
    op.execute("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processingstatus') THEN
                DROP TYPE processingstatus;
            END IF;
        END $$;
    """)
