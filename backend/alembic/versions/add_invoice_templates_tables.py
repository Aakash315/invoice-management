"""Add invoice templates tables

Revision ID: add_invoice_templates_tables
Revises: 
Create Date: 2024-01-15 10:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_invoice_templates_tables'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    """Create invoice templates tables and add template_id to invoices"""
    
    # Create invoice_templates table
    op.create_table('invoice_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        
        # Template Information
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('template_type', sa.String(50), nullable=False),
        
        # Company Branding
        sa.Column('company_logo_url', sa.Text()),
        sa.Column('company_name', sa.String(255)),
        sa.Column('company_address', sa.Text()),
        sa.Column('company_phone', sa.String(50)),
        sa.Column('company_email', sa.String(255)),
        
        # Color Scheme
        sa.Column('color_primary', sa.String(7), default='#2563eb'),
        sa.Column('color_secondary', sa.String(7), default='#6b7280'),
        sa.Column('color_accent', sa.String(7), default='#10b981'),
        sa.Column('color_text', sa.String(7), default='#111827'),
        sa.Column('color_background', sa.String(7), default='#ffffff'),
        
        # Typography
        sa.Column('font_family', sa.String(100), default='helvetica'),
        sa.Column('font_size_base', sa.Integer(), default=10),
        sa.Column('font_size_header', sa.Integer(), default=16),
        sa.Column('font_size_title', sa.Integer(), default=24),
        
        # Layout Settings
        sa.Column('header_style', sa.String(50), default='modern'),
        sa.Column('item_table_style', sa.String(50), default='modern'),
        sa.Column('totals_layout', sa.String(50), default='right'),
        sa.Column('layout_columns', sa.String(20), default='single'),
        
        # Field Visibility Settings
        sa.Column('show_invoice_number', sa.Boolean(), default=True),
        sa.Column('show_issue_date', sa.Boolean(), default=True),
        sa.Column('show_due_date', sa.Boolean(), default=True),
        sa.Column('show_notes', sa.Boolean(), default=True),
        sa.Column('show_terms', sa.Boolean(), default=True),
        sa.Column('show_payment_instructions', sa.Boolean(), default=True),
        sa.Column('show_company_logo', sa.Boolean(), default=True),
        sa.Column('show_company_details', sa.Boolean(), default=True),
        sa.Column('show_client_details', sa.Boolean(), default=True),
        sa.Column('show_line_items', sa.Boolean(), default=True),
        sa.Column('show_subtotal', sa.Boolean(), default=True),
        sa.Column('show_tax', sa.Boolean(), default=True),
        sa.Column('show_discount', sa.Boolean(), default=True),
        sa.Column('show_total', sa.Boolean(), default=True),
        sa.Column('show_paid_amount', sa.Boolean(), default=True),
        sa.Column('show_balance_due', sa.Boolean(), default=True),
        
        # Custom CSS
        sa.Column('custom_css', sa.Text()),
        
        # Template Status
        sa.Column('is_default', sa.Boolean(), default=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invoice_templates_id'), 'invoice_templates', ['id'], unique=False)
    op.create_index(op.f('ix_invoice_templates_user_id'), 'invoice_templates', ['user_id'], unique=False)
    op.create_index(op.f('ix_invoice_templates_name'), 'invoice_templates', ['name'], unique=False)
    
    # Create user_template_defaults table
    op.create_table('user_template_defaults',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('is_default', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['invoice_templates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_template_defaults_id'), 'user_template_defaults', ['id'], unique=False)
    op.create_index(op.f('ix_user_template_defaults_user_id'), 'user_template_defaults', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_template_defaults_template_id'), 'user_template_defaults', ['template_id'], unique=False)
    
    # Add design_template_id column to invoices table
    op.add_column('invoices', sa.Column('design_template_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_invoices_design_template_id', 'invoices', 'invoice_templates', ['design_template_id'], ['id'])
    op.create_index(op.f('ix_invoices_design_template_id'), 'invoices', ['design_template_id'], unique=False)
    
    # Create default templates for existing users
    op.execute("""
        INSERT INTO invoice_templates (user_id, name, description, template_type, created_at, updated_at)
        SELECT 
            u.id as user_id,
            'Modern Template' as name,
            'Clean, minimalist design with bold colors and modern fonts' as description,
            'modern' as template_type,
            NOW() as created_at,
            NOW() as updated_at
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM invoice_templates it WHERE it.user_id = u.id
        )
    """)
    
    op.execute("""
        INSERT INTO invoice_templates (user_id, name, description, template_type, created_at, updated_at)
        SELECT 
            u.id as user_id,
            'Classic Template' as name,
            'Traditional business invoice with conservative colors and serif fonts' as description,
            'classic' as template_type,
            NOW() as created_at,
            NOW() as updated_at
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM invoice_templates it WHERE it.user_id = u.id
        )
    """)
    
    op.execute("""
        INSERT INTO invoice_templates (user_id, name, description, template_type, created_at, updated_at)
        SELECT 
            u.id as user_id,
            'Minimal Template' as name,
            'Ultra-clean design with lots of white space and subtle colors' as description,
            'minimal' as template_type,
            NOW() as created_at,
            NOW() as updated_at
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM invoice_templates it WHERE it.user_id = u.id
        )
    """)
    
    op.execute("""
        INSERT INTO invoice_templates (user_id, name, description, template_type, created_at, updated_at)
        SELECT 
            u.id as user_id,
            'Corporate Template' as name,
            'Professional, trust-inspiring design with structured layout' as description,
            'corporate' as template_type,
            NOW() as created_at,
            NOW() as updated_at
        FROM users u
        WHERE NOT EXISTS (
            SELECT 1 FROM invoice_templates it WHERE it.user_id = u.id
        )
    """)
    
    # Set first template as default for each user
    op.execute("""
        INSERT INTO user_template_defaults (user_id, template_id, is_default, created_at)
        SELECT 
            it.user_id as user_id,
            MIN(it.id) as template_id,
            true as is_default,
            NOW() as created_at
        FROM invoice_templates it
        GROUP BY it.user_id
        ON CONFLICT DO NOTHING
    """)
    
    # Update invoices to use default template
    op.execute("""
        UPDATE invoices 
        SET template_id = (
            SELECT utd.template_id 
            FROM user_template_defaults utd 
            WHERE utd.user_id = invoices.created_by 
            AND utd.is_default = true
            LIMIT 1
        )
        WHERE template_id IS NULL
    """)

def downgrade():
    """Drop invoice templates tables and remove template_id from invoices"""
    
    # Remove template_id from invoices table
    op.drop_constraint('fk_invoices_template_id', 'invoices', type_='foreignkey')
    op.drop_index(op.f('ix_invoices_template_id'), 'invoices')
    op.drop_column('invoices', 'template_id')
    
    # Drop user_template_defaults table
    op.drop_table('user_template_defaults')
    
    # Drop invoice_templates table
    op.drop_table('invoice_templates')
