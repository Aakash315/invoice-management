"""merge_heads

Revision ID: e9b79ea648de
Revises: a21a455f606a, add_expense_tracking_tables, add_tax_columns_to_recurring_invoices
Create Date: 2025-12-30 19:18:32.237968

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9b79ea648de'
down_revision: Union[str, Sequence[str], None] = ('a21a455f606a', 'add_expense_tracking_tables', 'add_tax_columns_to_recurring_invoices')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
