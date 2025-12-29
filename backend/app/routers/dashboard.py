

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, extract
from app.database import get_db
from app.models.invoice import Invoice
from app.models.expense import Expense
from app.models.client import Client
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.utils.profit_calculator import calculate_profit_summary, calculate_monthly_profit

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    # Total invoices
    total_invoices = db.query(Invoice).count()
    

    # Multi-currency revenue calculation
    # For invoices in base currency, use total_amount
    # For other currencies, use base_currency_amount
    base_currency = current_user.base_currency or "INR"
    base_currency_revenue = db.query(func.sum(Invoice.total_amount)).filter(
        Invoice.status.in_(["sent", "paid", "overdue"]),
        Invoice.currency == base_currency
    ).scalar() or 0

    # Converted revenue from other currencies
    converted_revenue = db.query(func.sum(Invoice.base_currency_amount)).filter(
        Invoice.status.in_(["sent", "paid", "overdue"]),
        Invoice.currency != base_currency
    ).scalar() or 0

    total_revenue = base_currency_revenue + converted_revenue

    # Multi-currency pending amount calculation
    base_currency_pending = db.query(func.sum(Invoice.total_amount - Invoice.paid_amount)).filter(
        Invoice.status.in_(["sent", "overdue"]),
        Invoice.currency == base_currency
    ).scalar() or 0

    converted_pending = db.query(func.sum(Invoice.base_currency_amount - Invoice.paid_amount)).filter(
        Invoice.status.in_(["sent", "overdue"]),
        Invoice.currency != base_currency
    ).scalar() or 0

    pending_amount = base_currency_pending + converted_pending
    
    # Total clients
    total_clients = db.query(Client).count()
    
    # Calculate profit metrics
    profit_data = calculate_profit_summary(db, current_user.id, base_currency=base_currency)
    
    # Total expenses
    total_expenses = db.query(func.sum(Expense.base_currency_amount)).filter(
        Expense.created_by == current_user.id
    ).scalar() or 0
    
    total_profit = profit_data["summary"]["total_profit"]
    profit_margin = profit_data["summary"]["profit_margin"]

    # Recent invoices with client data
    recent_invoices = db.query(Invoice).options(
        selectinload(Invoice.client)
    ).order_by(
        Invoice.created_at.desc()
    ).limit(5).all()
    
    # Add balance to recent invoices
    for invoice in recent_invoices:
        invoice.balance = invoice.total_amount - invoice.paid_amount
    
    # Monthly profit data (last 6 months)
    monthly_profit = calculate_monthly_profit(db, current_user.id, 6, base_currency)

    # Monthly revenue (last 6 months for sent, paid, and overdue invoices)
    monthly_revenue = db.query(
        extract('month', Invoice.issue_date).label('month'),
        extract('year', Invoice.issue_date).label('year'),
        func.sum(Invoice.base_currency_amount).label('revenue')
    ).filter(
        Invoice.status.in_(["sent", "paid", "overdue"])
    ).group_by('month', 'year').order_by('year', 'month').all()
    
    # Invoice status breakdown
    status_breakdown = db.query(
        Invoice.status,
        func.count(Invoice.id).label('count')
    ).group_by(Invoice.status).all()
    
    return {
        "stats": {
            "total_invoices": total_invoices,
            "total_revenue": float(total_revenue),
            "total_expenses": float(total_expenses),
            "total_profit": float(total_profit),
            "profit_margin": float(profit_margin),
            "pending_amount": float(pending_amount),
            "total_clients": total_clients,
            "total_revenue_base_currency": base_currency,
            "pending_amount_base_currency": base_currency,
        },
        "recent_invoices": recent_invoices,
        "monthly_revenue": [
            {"month": int(r.month), "year": int(r.year), "revenue": float(r.revenue or 0.0)}
            for r in monthly_revenue
        ],
        "monthly_profit": monthly_profit,
        "status_breakdown": [
            {"status": r.status, "count": r.count}
            for r in status_breakdown
        ]
    }

@router.get("/profit")
async def get_profit_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed profit dashboard data"""
    base_currency = current_user.base_currency or "INR"
    
    # Current year profit summary
    from datetime import date
    current_year = date.today().year
    current_year_summary = calculate_profit_summary(
        db, current_user.id,
        date(current_year, 1, 1),
        date(current_year, 12, 31),
        base_currency
    )
    
    # Monthly profit for current year
    monthly_profit = calculate_monthly_profit(db, current_user.id, 12, base_currency)
    
    # Top profit-making clients
    from app.utils.profit_calculator import calculate_profit_by_client
    top_profit_clients = calculate_profit_by_client(db, current_user.id, limit=5)
    
    return {
        "summary": current_year_summary["summary"],
        "monthly_profit": monthly_profit,
        "top_profit_clients": top_profit_clients,
        "currency": base_currency
    }
