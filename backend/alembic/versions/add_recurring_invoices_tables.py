"""Add recurring invoices tables

Revision ID: add_recurring_invoices_tables
Revises: fix_email_status_values
Create Date: 2025-01-13 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_recurring_invoices_tables'
down_revision: Union[str, Sequence[str], None] = 'fix_email_status_values'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add recurring invoices tables."""
    
    # Create recurring_invoices table
    op.create_table('recurring_invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_name', sa.String(length=200), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('frequency', sa.String(length=20), nullable=False),  # daily, weekly, monthly, quarterly, yearly
        sa.Column('interval_value', sa.Integer(), default=1, nullable=False),  # every N units
        sa.Column('day_of_week', sa.Integer(), nullable=True),  # 0=Monday, 6=Sunday for weekly
        sa.Column('day_of_month', sa.Integer(), nullable=True),  # 1-31 for monthly
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('occurrences_limit', sa.Integer(), nullable=True),  # optional limit
        sa.Column('current_occurrence', sa.Integer(), default=0, nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('auto_send', sa.Boolean(), default=False, nullable=False),
        sa.Column('email_subject', sa.String(length=255), nullable=True),
        sa.Column('email_message', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_generated_at', sa.DateTime(), nullable=True),
        sa.Column('next_due_date', sa.Date(), nullable=False),
        sa.Column('generation_count', sa.Integer(), default=0, nullable=False),  # how many times generated
        sa.Column('failed_generations', sa.Integer(), default=0, nullable=False),  # failed attempts
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_recurring_invoices_id'), 'recurring_invoices', ['id'], unique=False)
    op.create_index(op.f('ix_recurring_invoices_client_id'), 'recurring_invoices', ['client_id'], unique=False)
    op.create_index(op.f('ix_recurring_invoices_created_by'), 'recurring_invoices', ['created_by'], unique=False)
    op.create_index(op.f('ix_recurring_invoices_next_due_date'), 'recurring_invoices', ['next_due_date'], unique=False)
    op.create_index(op.f('ix_recurring_invoices_is_active'), 'recurring_invoices', ['is_active'], unique=False)
    
    # Create recurring_invoice_template_items table
    op.create_table('recurring_invoice_template_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recurring_invoice_id', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, default=1),
        sa.Column('rate', sa.Float(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, default=0),
        sa.ForeignKeyConstraint(['recurring_invoice_id'], ['recurring_invoices.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_index(op.f('ix_recurring_invoice_template_items_id'), 'recurring_invoice_template_items', ['id'], unique=False)
    op.create_index(op.f('ix_recurring_invoice_template_items_recurring_invoice_id'), 'recurring_invoice_template_items', ['recurring_invoice_id'], unique=False)
    
    # Add template_id and generated_by_template columns to invoices table
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('invoices') as batch_op:
        batch_op.add_column(sa.Column('template_id', sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f('ix_invoices_template_id'))
        batch_op.add_column(sa.Column('generated_by_template', sa.Boolean(), default=False, nullable=False))
        # Note: Foreign key constraint will be created separately after all tables are created
    
    print("Recurring invoices tables created successfully!")


def downgrade() -> None:
    """Drop recurring invoices tables."""
    # Remove the new columns from invoices table using batch mode
    with op.batch_alter_table('invoices') as batch_op:
        try:
            batch_op.drop_column('generated_by_template')
            batch_op.drop_column('template_id')
        except Exception:
            pass
    
    # Drop indexes and tables
    op.drop_index(op.f('ix_recurring_invoice_template_items_recurring_invoice_id'), table_name='recurring_invoice_template_items')
    op.drop_index(op.f('ix_recurring_invoice_template_items_id'), table_name='recurring_invoice_template_items')
    op.drop_table('recurring_invoice_template_items')
    
    op.drop_index(op.f('ix_recurring_invoices_is_active'), table_name='recurring_invoices')
    op.drop_index(op.f('ix_recurring_invoices_next_due_date'), table_name='recurring_invoices')
    op.drop_index(op.f('ix_recurring_invoices_created_by'), table_name='recurring_invoices')
    op.drop_index(op.f('ix_recurring_invoices_client_id'), table_name='recurring_invoices')
    op.drop_index(op.f('ix_recurring_invoices_id'), table_name='recurring_invoices')
    op.drop_table('recurring_invoices')
    
    print("Recurring invoices tables dropped successfully!")
