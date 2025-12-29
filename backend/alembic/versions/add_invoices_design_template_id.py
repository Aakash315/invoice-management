"""Add design_template_id column to invoices table

Revision ID: add_design_template_id
Revises: 
Create Date: 2024-12-20 15:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_design_template_id'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Only add the design_template_id column if it doesn't exist
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    columns = [c['name'] for c in inspector.get_columns('invoices')]
    
    if 'design_template_id' not in columns:
        with op.batch_alter_table('invoices') as batch_op:
            batch_op.add_column(sa.Column('design_template_id', sa.Integer(), nullable=True))
            batch_op.create_foreign_key('fk_invoices_design_template_id', 'invoice_templates', ['design_template_id'], ['id'])
            batch_op.create_index(op.f('ix_invoices_design_template_id'), ['design_template_id'], unique=False)


def downgrade():
    # Remove the design_template_id column
    with op.batch_alter_table('invoices') as batch_op:
        batch_op.drop_index(op.f('ix_invoices_design_template_id'))
        batch_op.drop_constraint('fk_invoices_design_template_id', type_='foreignkey')
        batch_op.drop_column('design_template_id')
