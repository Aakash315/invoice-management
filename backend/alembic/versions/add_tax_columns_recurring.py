"""add_tax_columns_to_recurring_invoices

Revision ID: add_tax_columns_to_recurring_invoices
Revises: e9b79ea648de, add_recurring_invoice_columns
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_tax_columns_to_recurring_invoices'
down_revision: Union[str, Sequence[str], None] = ('e9b79ea648de', 'add_recurring_invoice_columns')
branch_labels = None
depends_on = None

def upgrade():
    # Add tax_enabled column
    op.add_column('recurring_invoices', sa.Column('tax_enabled', sa.Boolean(), nullable=False, server_default='false'))
    # Add tax_rate column
    op.add_column('recurring_invoices', sa.Column('tax_rate', sa.Float(), nullable=False, server_default='0.0'))

def downgrade():
    op.drop_column('recurring_invoices', 'tax_rate')
    op.drop_column('recurring_invoices', 'tax_enabled')

