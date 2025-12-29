"""Add recurring invoice columns to invoices table

Revision ID: add_recurring_invoice_columns
Revises: d6af8b3b632d, add_design_template_id, add_invoice_templates_tables
Create Date: 2025-12-29 12:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_recurring_invoice_columns'
down_revision = ('d6af8b3b632d', 'add_design_template_id', 'add_invoice_templates_tables')
branch_labels = None
depends_on = None

def upgrade():
    """Add recurring invoice related columns to invoices table"""
    
    # Add recurring template columns to invoices table
    op.add_column('invoices', sa.Column('recurring_template_id', sa.Integer(), nullable=True))
    op.add_column('invoices', sa.Column('generated_by_template', sa.Boolean(), default=False, nullable=False))
    
    # Add foreign key constraint for recurring_template_id
    op.create_foreign_key('fk_invoices_recurring_template_id', 'invoices', 'recurring_invoices', ['recurring_template_id'], ['id'])
    
    # Create index for recurring_template_id
    op.create_index(op.f('ix_invoices_recurring_template_id'), 'invoices', ['recurring_template_id'], unique=False)
    
    # Add index for generated_by_template
    op.create_index(op.f('ix_invoices_generated_by_template'), 'invoices', ['generated_by_template'], unique=False)

def downgrade():
    """Remove recurring invoice related columns from invoices table"""
    
    # Drop foreign key constraint
    op.drop_constraint('fk_invoices_recurring_template_id', 'invoices', type_='foreignkey')
    
    # Drop indexes
    op.drop_index(op.f('ix_invoices_generated_by_template'), 'invoices')
    op.drop_index(op.f('ix_invoices_recurring_template_id'), 'invoices')
    
    # Remove columns
    op.drop_column('invoices', 'generated_by_template')
    op.drop_column('invoices', 'recurring_template_id')

