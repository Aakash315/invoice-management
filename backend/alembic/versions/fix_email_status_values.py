"""Fix email status values - convert to uppercase to match Python enum

Revision ID: fix_email_status_values
Revises: add_missing_email_history_columns
Create Date: 2025-12-22 13:45:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'fix_email_status_values'
down_revision = 'add_missing_email_history_columns'
branch_labels = None
depends_on = None

def upgrade():
    # Fix status values by converting them to uppercase to match Python enum
    conn = op.get_bind()
    
    # Update status values to match Python enum (uppercase)
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'PENDING' WHERE status = 'pending'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'SENT' WHERE status = 'sent'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'DELIVERED' WHERE status = 'delivered'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'OPENED' WHERE status = 'opened'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'BOUNCED' WHERE status = 'bounced'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'FAILED' WHERE status = 'failed'
    """))

def downgrade():
    # Convert back to lowercase (optional rollback)
    conn = op.get_bind()
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'pending' WHERE status = 'PENDING'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'sent' WHERE status = 'SENT'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'delivered' WHERE status = 'DELIVERED'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'opened' WHERE status = 'OPENED'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'bounced' WHERE status = 'BOUNCED'
    """))
    
    conn.execute(sa.text("""
        UPDATE email_history 
        SET status = 'failed' WHERE status = 'FAILED'
    """))
