"""final_merge_heads

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6, 4cdcc3bc994d
Create Date: 2025-12-30 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f6', '4cdcc3bc994d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

