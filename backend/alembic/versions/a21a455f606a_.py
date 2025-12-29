"""empty message

Revision ID: a21a455f606a
Revises: add_invoice_templates_tables, d6af8b3b632d
Create Date: 2025-12-29 11:35:53.269650

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a21a455f606a'
down_revision: Union[str, Sequence[str], None] = ('add_invoice_templates_tables', 'd6af8b3b632d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
