"""add_expense_tracking_tables

Revision ID: add_expense_tracking_tables
Revises: 
Create Date: 2024-12-19 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_expense_tracking_tables'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create expense_categories table
    op.create_table('expense_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expense_categories_id'), 'expense_categories', ['id'], unique=False)
    op.create_index(op.f('ix_expense_categories_name'), 'expense_categories', ['name'], unique=True)

    # Create expenses table
    op.create_table('expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=False),
        sa.Column('vendor', sa.String(length=200), nullable=True),
        sa.Column('payment_method', sa.String(length=50), nullable=True),
        sa.Column('receipt_file', sa.String(length=500), nullable=True),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('invoice_id', sa.Integer(), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=True),
        sa.Column('base_currency_amount', sa.Float(), nullable=True),
        sa.Column('exchange_rate', sa.Float(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['expense_categories.id'], ),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_expenses_id'), 'expenses', ['id'], unique=False)
    op.create_index(op.f('ix_expenses_date'), 'expenses', ['date'], unique=False)

    # Insert default expense categories
    default_categories = [
        {'name': 'Office Supplies', 'description': 'Office stationery and supplies', 'color': '#3B82F6', 'icon': 'folder'},
        {'name': 'Software & Subscriptions', 'description': 'Software licenses and subscriptions', 'color': '#10B981', 'icon': 'desktop'},
        {'name': 'Hardware & Equipment', 'description': 'Computers, printers, and equipment', 'color': '#F59E0B', 'icon': 'cpu'},
        {'name': 'Travel & Transportation', 'description': 'Business travel and transportation', 'color': '#EF4444', 'icon': 'car'},
        {'name': 'Meals & Entertainment', 'description': 'Business meals and entertainment', 'color': '#8B5CF6', 'icon': 'utensils'},
        {'name': 'Professional Services', 'description': 'Legal, accounting, consulting services', 'color': '#06B6D4', 'icon': 'briefcase'},
        {'name': 'Marketing & Advertising', 'description': 'Marketing campaigns and advertising', 'color': '#EC4899', 'icon': 'megaphone'},
        {'name': 'Rent & Utilities', 'description': 'Office rent and utilities', 'color': '#84CC16', 'icon': 'home'},
        {'name': 'Salaries & Wages', 'description': 'Employee salaries and wages', 'color': '#F97316', 'icon': 'users'},
        {'name': 'Taxes & Fees', 'description': 'Business taxes and regulatory fees', 'color': '#6366F1', 'icon': 'file-text'},
        {'name': 'Bank Charges', 'description': 'Banking fees and charges', 'color': '#14B8A6', 'icon': 'credit-card'},
        {'name': 'Insurance', 'description': 'Business insurance premiums', 'color': '#F43F5E', 'icon': 'shield'},
        {'name': 'Miscellaneous', 'description': 'Other business expenses', 'color': '#6B7280', 'icon': 'more-horizontal'}
    ]

    # Insert categories with a placeholder user_id (1) - will be updated when users create their own
    from sqlalchemy import text
    for category in default_categories:
        op.execute(
            text("""
                INSERT INTO expense_categories (name, description, color, icon, created_by, created_at, updated_at, is_active)
                VALUES (:name, :description, :color, :icon, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
            """),
            category
        )

def downgrade():
    op.drop_table('expenses')
    op.drop_table('expense_categories')
