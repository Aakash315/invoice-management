"""add_client_deposit_fields

Revision ID: add_client_deposit_fields
Revises: final_merge_heads
Create Date: 2025-01-20 12:00:00.000000

"""
from typing import Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_client_deposit_fields'
down_revision = 'final_merge_heads'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add deposit columns to clients table
    op.add_column('clients', sa.Column('has_deposit', sa.Boolean(), nullable=True, default=False))
    op.add_column('clients', sa.Column('deposit_amount', sa.Float(), nullable=True))
    op.add_column('clients', sa.Column('deposit_date', sa.Date(), nullable=True))
    op.add_column('clients', sa.Column('deposit_type', sa.String(50), nullable=True))
    
    # Set default value for has_deposit
    op.execute("UPDATE clients SET has_deposit = FALSE WHERE has_deposit IS NULL")
    op.alter_column('clients', 'has_deposit', existing_type=sa.Boolean(), nullable=False, server_default='false')


def downgrade() -> None:
    # Remove deposit columns from clients table
    op.drop_column('clients', 'deposit_type')
    op.drop_column('clients', 'deposit_date')
    op.drop_column('clients', 'deposit_amount')
    op.drop_column('clients', 'has_deposit')

