from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.user import User

def calculate_expense_totals(
    expenses: List[Expense],
    base_currency: str = "INR"
) -> Dict[str, float]:
    """Calculate total expenses in base currency"""
    total_base_currency = 0.0
    
    for expense in expenses:
        if expense.base_currency_amount:
            total_base_currency += expense.base_currency_amount
        else:
            total_base_currency += expense.amount
    
    return {
        "total_amount": total_base_currency,
        "currency": base_currency,
        "count": len(expenses)
    }

def get_expense_statistics(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> Dict[str, Any]:
    """Get comprehensive expense statistics"""
    query = db.query(Expense).filter(Expense.created_by == user_id)
    
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    expenses = query.all()
    
    if not expenses:
        return {
            "total_expenses": 0.0,
            "expense_count": 0,
            "average_expense": 0.0,
            "by_category": [],
            "by_payment_method": [],
            "monthly_trend": []
        }
    
    # Basic statistics
    total_expenses = sum(expense.base_currency_amount or expense.amount for expense in expenses)
    expense_count = len(expenses)
    average_expense = total_expenses / expense_count if expense_count > 0 else 0
    
    # By category
    category_stats = db.query(
        ExpenseCategory.name,
        func.sum(Expense.base_currency_amount).label('total'),
        func.count(Expense.id).label('count')
    ).join(Expense).filter(
        Expense.created_by == user_id
    ).group_by(ExpenseCategory.name).all()
    
    by_category = [
        {
            "category": stat.name,
            "amount": float(stat.total or 0.0),
            "count": stat.count,
            "percentage": float((stat.total or 0.0) / total_expenses * 100) if total_expenses > 0 else 0
        }
        for stat in category_stats
    ]
    
    # By payment method
    payment_stats = db.query(
        Expense.payment_method,
        func.sum(Expense.base_currency_amount).label('total'),
        func.count(Expense.id).label('count')
    ).filter(
        Expense.created_by == user_id
    ).group_by(Expense.payment_method).all()
    
    by_payment_method = [
        {
            "method": stat.payment_method or "Unknown",
            "amount": float(stat.total or 0.0),
            "count": stat.count
        }
        for stat in payment_stats
    ]
    
    # Monthly trend
    from sqlalchemy import extract
    monthly_stats = db.query(
        extract('year', Expense.date).label('year'),
        extract('month', Expense.date).label('month'),
        func.sum(Expense.base_currency_amount).label('total')
    ).filter(
        Expense.created_by == user_id
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    monthly_trend = [
        {
            "year": int(stat.year),
            "month": int(stat.month),
            "amount": float(stat.total or 0.0)
        }
        for stat in monthly_stats
    ]
    
    return {
        "total_expenses": total_expenses,
        "expense_count": expense_count,
        "average_expense": average_expense,
        "by_category": by_category,
        "by_payment_method": by_payment_method,
        "monthly_trend": monthly_trend
    }

def filter_expenses(
    db: Session,
    user_id: int,
    category_id: Optional[int] = None,
    client_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None
) -> List[Expense]:
    """Filter expenses based on various criteria"""
    query = db.query(Expense).filter(Expense.created_by == user_id)
    
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if client_id:
        query = query.filter(Expense.client_id == client_id)
    if payment_method:
        query = query.filter(Expense.payment_method == payment_method)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    if min_amount:
        query = query.filter(Expense.amount >= min_amount)
    if max_amount:
        query = query.filter(Expense.amount <= max_amount)
    if search:
        query = query.filter(
            or_(
                Expense.description.contains(search),
                Expense.vendor.contains(search)
            )
        )
    
    return query.order_by(Expense.date.desc()).all()

def validate_expense_data(expense_data: Dict[str, Any]) -> List[str]:
    """Validate expense data and return list of errors"""
    errors = []
    
    if not expense_data.get('amount') or expense_data['amount'] <= 0:
        errors.append("Amount must be greater than 0")
    
    if not expense_data.get('category_id'):
        errors.append("Category is required")
    
    if not expense_data.get('date'):
        errors.append("Date is required")
    
    if not expense_data.get('description') or not expense_data['description'].strip():
        errors.append("Description is required")
    
    # Validate currency if provided
    currency = expense_data.get('currency', 'INR')
    valid_currencies = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']
    if currency not in valid_currencies:
        errors.append(f"Currency must be one of: {', '.join(valid_currencies)}")
    
    # Validate exchange rate if currency is different from base
    if currency != 'INR' and not expense_data.get('exchange_rate'):
        errors.append("Exchange rate is required for non-INR currencies")
    
    return errors

def format_expense_amount(amount: float, currency: str = "INR") -> str:
    """Format expense amount for display"""
    currency_symbols = {
        "INR": "₹",
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "CAD": "C$",
        "AUD": "A$",
        "JPY": "¥"
    }
    
    symbol = currency_symbols.get(currency, currency)
    return f"{symbol}{amount:,.2f}"

def get_tax_deductible_categories() -> List[str]:
    """Get list of tax-deductible expense categories"""
    return [
        "Office Supplies",
        "Software & Subscriptions", 
        "Hardware & Equipment",
        "Travel & Transportation",
        "Professional Services",
        "Marketing & Advertising",
        "Rent & Utilities",
        "Taxes & Fees",
        "Bank Charges",
        "Insurance"
    ]

def calculate_deductible_expenses(
    db: Session,
    user_id: int,
    tax_year: int
) -> Dict[str, Any]:
    """Calculate tax-deductible expenses for a given year"""
    deductible_categories = get_tax_deductible_categories()
    
    start_date = datetime(tax_year, 1, 1).date()
    end_date = datetime(tax_year, 12, 31).date()
    
    query = db.query(
        ExpenseCategory.name.label("category"),
        ExpenseCategory.color.label("color"),
        func.sum(Expense.base_currency_amount).label("total_amount"),
        func.count(Expense.id).label("expense_count")
    ).join(Expense, ExpenseCategory.id == Expense.category_id).filter(
        Expense.created_by == user_id,
        Expense.date >= start_date,
        Expense.date <= end_date,
        ExpenseCategory.name.in_(deductible_categories)
    ).group_by(ExpenseCategory.name, ExpenseCategory.color)
    
    result = query.order_by(func.sum(Expense.base_currency_amount).desc()).all()
    
    total_deductible = sum(float(r.total_amount or 0) for r in result)
    
    return {
        "tax_year": tax_year,
        "total_deductible": total_deductible,
        "categories": [
            {
                "category": r.category,
                "amount": float(r.total_amount or 0),
                "count": r.expense_count,
                "color": r.color
            }
            for r in result
        ]
    }
