"""Add email history table

Revision ID: add_email_history_table
Revises: 
Create Date: 2025-12-22 12:55:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_email_history_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create email_history table
    op.create_table('email_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('recipient', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=500), nullable=False),
        sa.Column('cc', sa.Text(), nullable=True),
        sa.Column('bcc', sa.Text(), nullable=True),
        sa.Column('body_preview', sa.Text(), nullable=True),
        sa.Column('attachment_filename', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_history_id'), 'email_history', ['id'], unique=False)
    op.create_index(op.f('ix_email_history_invoice_id'), 'email_history', ['invoice_id'], unique=False)
    op.create_index(op.f('ix_email_history_status'), 'email_history', ['status'], unique=False)

def downgrade():
    op.drop_table('email_history')
