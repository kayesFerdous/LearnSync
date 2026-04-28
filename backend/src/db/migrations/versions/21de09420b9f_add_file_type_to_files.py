"""add_file_type_to_files

Revision ID: 21de09420b9f
Revises: 9f9ab3f598e3
Create Date: 2026-01-31 20:01:02.592033

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '21de09420b9f'
down_revision: Union[str, Sequence[str], None] = '9f9ab3f598e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the FileType enum type first
    filetype_enum = sa.Enum(
        'PDF', 'DOCX', 'PPTX', 'XLSX', 'HTML', 'MARKDOWN', 
        'PNG', 'JPEG', 'TIFF', 'WAV', 'MP3', 'VTT', 'URL', 'UNKNOWN', 
        name='filetype'
    )
    filetype_enum.create(op.get_bind(), checkfirst=True)
    
    # Add the column with a server default for existing rows
    op.add_column('files', sa.Column(
        'file_type', 
        filetype_enum,
        nullable=False,
        server_default='UNKNOWN'
    ))
    
    # Remove the server default after adding the column
    op.alter_column('files', 'file_type', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the column
    op.drop_column('files', 'file_type')
    
    # Drop the enum type
    filetype_enum = sa.Enum(name='filetype')
    filetype_enum.drop(op.get_bind(), checkfirst=True)
