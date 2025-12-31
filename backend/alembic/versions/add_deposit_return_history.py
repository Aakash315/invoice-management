"""add_deposit_return_history

Revision ID: add_deposit_return_history
Revises: e9b79ea648de
Create Date: 2024-01-01 00:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_deposit_return_history'
down_revision = 'e9b79ea648de'
branch_labels = None
depends_on = None


def upgrade():
    # Create deposit_return_history table
    op.create_table(
        'deposit_return_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('returned_date', sa.DateTime(), nullable=True),
        sa.Column('returned_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
        sa.ForeignKeyConstraint(['returned_by'], ['users.id'], )
    )
    op.create_index(op.f('ix_deposit_return_history_id'), 'deposit_return_history', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_deposit_return_history_id'), table_name='deposit_return_history')
    op.drop_table('deposit_return_history')

