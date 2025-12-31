"""Add document fields to clients table

Revision ID: a1b2c3d4e5f6
Revises: e9b79ea648de
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'e9b79ea648de'
branch_labels = None
depends_on = None

def upgrade():
    # Add document_type and document_path columns
    op.add_column('clients', sa.Column('document_type', sa.String(50), nullable=True))
    op.add_column('clients', sa.Column('document_path', sa.String(500), nullable=True))

def downgrade():
    op.drop_column('clients', 'document_path')
    op.drop_column('clients', 'document_type')

