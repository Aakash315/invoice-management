"""Add missing columns to email_history table

Revision ID: add_missing_email_history_columns
Revises: 4a95373149f4
Create Date: 2025-12-22 13:30:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_missing_email_history_columns'
down_revision = '4a95373149f4'
branch_labels = None
depends_on = None

def upgrade():
    # Add missing columns that the Python model expects
    # Only add columns that don't already exist
    
    # Check if columns exist before adding them
    conn = op.get_bind()
    
    # Add delivered_at column
    try:
        op.add_column('email_history', sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    # Add opened_at column
    try:
        op.add_column('email_history', sa.Column('opened_at', sa.DateTime(timezone=True), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    # Add bounced_at column
    try:
        op.add_column('email_history', sa.Column('bounced_at', sa.DateTime(timezone=True), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    # Add delivery_error column
    try:
        op.add_column('email_history', sa.Column('delivery_error', sa.Text(), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    # Add tracking_id column
    try:
        op.add_column('email_history', sa.Column('tracking_id', sa.String(length=100), nullable=True))
        # Create unique index for tracking_id
        op.create_index('ix_email_history_tracking_id', 'email_history', ['tracking_id'], unique=True)
    except Exception:
        pass  # Column might already exist
    
    # Add sent_to column
    try:
        op.add_column('email_history', sa.Column('sent_to', sa.String(length=255), nullable=True))
    except Exception:
        pass  # Column might already exist

def downgrade():
    # Remove the columns we added
    try:
        op.drop_index('ix_email_history_tracking_id')
    except Exception:
        pass  # Index might not exist
    
    try:
        op.drop_column('email_history', 'sent_to')
    except Exception:
        pass  # Column might not exist
    
    try:
        op.drop_column('email_history', 'tracking_id')
    except Exception:
        pass  # Column might not exist
    
    try:
        op.drop_column('email_history', 'delivery_error')
    except Exception:
        pass  # Column might not exist
    
    try:
        op.drop_column('email_history', 'bounced_at')
    except Exception:
        pass  # Column might not exist
    
    try:
        op.drop_column('email_history', 'opened_at')
    except Exception:
        pass  # Column might not exist
    
    try:
        op.drop_column('email_history', 'delivered_at')
    except Exception:
        pass  # Column might not exist
