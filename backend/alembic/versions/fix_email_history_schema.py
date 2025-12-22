"""Fix email_history table schema - add missing columns

Revision ID: fix_email_history_schema
Revises: update_email_history_table
Create Date: 2025-12-22 13:15:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'fix_email_history_schema'
down_revision = 'update_email_history_table'
branch_labels = None
depends_on = None

def upgrade():
    # Add missing columns that the Python model expects
    op.add_column('email_history', sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('email_history', sa.Column('opened_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('email_history', sa.Column('bounced_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('email_history', sa.Column('delivery_error', sa.Text(), nullable=True))
    op.add_column('email_history', sa.Column('tracking_id', sa.String(length=100), nullable=True))
    op.add_column('email_history', sa.Column('sent_to', sa.String(length=255), nullable=True))
    op.add_column('email_history', sa.Column('cc', sa.Text(), nullable=True))
    op.add_column('email_history', sa.Column('bcc', sa.Text(), nullable=True))
    op.add_column('email_history', sa.Column('body_preview', sa.Text(), nullable=True))
    op.add_column('email_history', sa.Column('attachment_filename', sa.String(length=255), nullable=True))
    
    # Create unique index for tracking_id
    op.create_index('ix_email_history_tracking_id', 'email_history', ['tracking_id'], unique=True)

def downgrade():
    # Remove the columns we added
    op.drop_index('ix_email_history_tracking_id')
    op.drop_column('email_history', 'attachment_filename')
    op.drop_column('email_history', 'body_preview')
    op.drop_column('email_history', 'bcc')
    op.drop_column('email_history', 'cc')
    op.drop_column('email_history', 'sent_to')
    op.drop_column('email_history', 'tracking_id')
    op.drop_column('email_history', 'delivery_error')
    op.drop_column('email_history', 'bounced_at')
    op.drop_column('email_history', 'opened_at')
    op.drop_column('email_history', 'delivered_at')
