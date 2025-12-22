"""Update email history table schema

Revision ID: update_email_history_table
Revises: add_email_history_table
Create Date: 2025-12-22 13:00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'update_email_history_table'
down_revision = 'add_email_history_table'
branch_labels = None
depends_on = None

def upgrade():
    # Add missing columns to email_history table
    op.add_column('email_history', sa.Column('recipient', sa.String(length=255), nullable=True))
    op.add_column('email_history', sa.Column('subject', sa.String(length=500), nullable=True))
    op.add_column('email_history', sa.Column('cc', sa.Text(), nullable=True))
    op.add_column('email_history', sa.Column('bcc', sa.Text(), nullable=True))
    op.add_column('email_history', sa.Column('body_preview', sa.Text(), nullable=True))
    op.add_column('email_history', sa.Column('attachment_filename', sa.String(length=255), nullable=True))
    op.add_column('email_history', sa.Column('error_message', sa.Text(), nullable=True))
    
    # Create new column 'recipient' from existing 'sent_to' if needed
    # First check if sent_to exists and copy data
    op.execute("UPDATE email_history SET recipient = sent_to WHERE recipient IS NULL AND sent_to IS NOT NULL")
    
    # Drop the old sent_to column
    try:
        op.drop_column('email_history', 'sent_to')
    except:
        # Column might not exist, ignore error
        pass

def downgrade():
    # Add back sent_to column and copy data from recipient
    op.add_column('email_history', sa.Column('sent_to', sa.String(length=255), nullable=True))
    op.execute("UPDATE email_history SET sent_to = recipient WHERE sent_to IS NULL AND recipient IS NOT NULL")
    
    # Drop the new columns
    op.drop_column('email_history', 'recipient')
    op.drop_column('email_history', 'subject')
    op.drop_column('email_history', 'cc')
    op.drop_column('email_history', 'bcc')
    op.drop_column('email_history', 'body_preview')
    op.drop_column('email_history', 'attachment_filename')
    op.drop_column('email_history', 'error_message')
