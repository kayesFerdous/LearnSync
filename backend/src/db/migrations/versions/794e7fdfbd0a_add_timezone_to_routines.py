"""add timezone to routines

Revision ID: 794e7fdfbd0a
Revises: 805b22dd50b8
Create Date: 2026-01-16 17:33:46.505955

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '794e7fdfbd0a'
down_revision: Union[str, Sequence[str], None] = '805b22dd50b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('routines', sa.Column('timezone', sa.String(), nullable=False, server_default='Asia/Dhaka'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('routines', 'timezone')
