from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db
from app.models.invoice import Invoice
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.user import User
from app.models.client import Client
from app.utils.dependencies import get_current_user
from datetime import datetime, timedelta
from app.schemas.report import RevenueReportItem, TopClientReportItem, LatePayingClientsReportItem
from typing import List

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/late-paying-clients", response_model=List[LatePayingClientsReportItem])
async def get_late_paying_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.query(
        Client.id.label("client_id"),
        Client.name.label("client_name"),
        func.count(Invoice.id).label("overdue_invoices"),
        func.sum(Invoice.total_amount - Invoice.paid_amount).label("total_overdue_amount")
    ).join(Invoice, Client.id == Invoice.client_id).filter(
        Invoice.status == "overdue"
    ).group_by(Client.id, Client.name).order_by(
        func.count(Invoice.id).desc()
    ).all()

    return result

@router.get("/top-clients", response_model=List[TopClientReportItem])
async def get_top_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 5,
):
    result = db.query(
        Client.id.label("client_id"),
        Client.name.label("client_name"),
        func.sum(Invoice.base_currency_amount).label("total_revenue")
    ).join(Invoice, Client.id == Invoice.client_id).filter(
        Invoice.status.in_(["paid", "sent", "overdue"])
    ).group_by(Client.id, Client.name).order_by(
        func.sum(Invoice.base_currency_amount).desc()
    ).limit(limit).all()

    return result

@router.get("/revenue", response_model=List[RevenueReportItem])
async def get_revenue_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: str = None,
    end_date: str = None,
    group_by: str = "month",
):
    query = db.query(
        func.sum(Invoice.base_currency_amount).label("total_revenue")
    ).filter(
        Invoice.status.in_(["paid", "sent", "overdue"])
    )

    if start_date:
        query = query.filter(Invoice.issue_date >= start_date)
    if end_date:
        query = query.filter(Invoice.issue_date <= end_date)

    if group_by == "day":
        query = query.add_columns(
            extract('year', Invoice.issue_date).label('year'),
            extract('month', Invoice.issue_date).label('month'),
            extract('day', Invoice.issue_date).label('day')
        ).group_by("year", "month", "day").order_by("year", "month", "day")
    elif group_by == "month":
        query = query.add_columns(
            extract('year', Invoice.issue_date).label('year'),
            extract('month', Invoice.issue_date).label('month')
        ).group_by("year", "month").order_by("year", "month")
    else: # year
        query = query.add_columns(
            extract('year', Invoice.issue_date).label('year')
        ).group_by("year").order_by("year")

    result = query.all()
    return result

@router.get("/expenses/by-category")
async def get_expenses_by_category(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: str = None,
    end_date: str = None,
):
    """Get expenses breakdown by category"""
    query = db.query(
        ExpenseCategory.name.label("category_name"),
        ExpenseCategory.color.label("category_color"),
        func.sum(Expense.base_currency_amount).label("total_expenses"),
        func.count(Expense.id).label("expense_count")
    ).join(Expense, ExpenseCategory.id == Expense.category_id).filter(
        Expense.created_by == current_user.id
    )

    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    result = query.group_by(
        ExpenseCategory.name, ExpenseCategory.color
    ).order_by(func.sum(Expense.base_currency_amount).desc()).all()

    return result

@router.get("/expenses/by-vendor")
async def get_top_expense_vendors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10,
    start_date: str = None,
    end_date: str = None,
):
    """Get top expense vendors/suppliers"""
    query = db.query(
        Expense.vendor.label("vendor"),
        func.sum(Expense.base_currency_amount).label("total_spent"),
        func.count(Expense.id).label("expense_count")
    ).filter(
        Expense.created_by == current_user.id,
        Expense.vendor.isnot(None)
    )

    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    result = query.group_by(Expense.vendor).order_by(
        func.sum(Expense.base_currency_amount).desc()
    ).limit(limit).all()

    return result

@router.get("/profit-analysis")
async def get_profit_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: str = None,
    end_date: str = None,
    group_by: str = "month",
):
    """Get profit analysis (Revenue - Expenses)"""
    # Get revenue data
    revenue_query = db.query(
        func.sum(Invoice.base_currency_amount).label("total_revenue")
    ).filter(
        Invoice.status.in_(["paid", "sent", "overdue"]),
        Invoice.created_by == current_user.id
    )

    if start_date:
        revenue_query = revenue_query.filter(Invoice.issue_date >= start_date)
    if end_date:
        revenue_query = revenue_query.filter(Invoice.issue_date <= end_date)

    total_revenue = revenue_query.scalar() or 0.0

    # Get expense data
    expense_query = db.query(
        func.sum(Expense.base_currency_amount).label("total_expenses")
    ).filter(
        Expense.created_by == current_user.id
    )

    if start_date:
        expense_query = expense_query.filter(Expense.date >= start_date)
    if end_date:
        expense_query = expense_query.filter(Expense.date <= end_date)

    total_expenses = expense_query.scalar() or 0.0

    # Calculate profit
    total_profit = total_revenue - total_expenses
    profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0

    # Monthly breakdown if requested
    monthly_data = []
    if group_by in ["month", "day"]:
        # Revenue breakdown
        if group_by == "month":
            revenue_breakdown = db.query(
                extract('year', Invoice.issue_date).label('year'),
                extract('month', Invoice.issue_date).label('month'),
                func.sum(Invoice.base_currency_amount).label('revenue')
            ).filter(
                Invoice.status.in_(["paid", "sent", "overdue"]),
                Invoice.created_by == current_user.id
            )
            
            expense_breakdown = db.query(
                extract('year', Expense.date).label('year'),
                extract('month', Expense.date).label('month'),
                func.sum(Expense.base_currency_amount).label('expenses')
            ).filter(
                Expense.created_by == current_user.id
            )
        else:  # day
            revenue_breakdown = db.query(
                extract('year', Invoice.issue_date).label('year'),
                extract('month', Invoice.issue_date).label('month'),
                extract('day', Invoice.issue_date).label('day'),
                func.sum(Invoice.base_currency_amount).label('revenue')
            ).filter(
                Invoice.status.in_(["paid", "sent", "overdue"]),
                Invoice.created_by == current_user.id
            )
            
            expense_breakdown = db.query(
                extract('year', Expense.date).label('year'),
                extract('month', Expense.date).label('month'),
                extract('day', Expense.date).label('day'),
                func.sum(Expense.base_currency_amount).label('expenses')
            ).filter(
                Expense.created_by == current_user.id
            )

        if start_date:
            revenue_breakdown = revenue_breakdown.filter(Invoice.issue_date >= start_date)
            expense_breakdown = expense_breakdown.filter(Expense.date >= start_date)
        if end_date:
            revenue_breakdown = revenue_breakdown.filter(Invoice.issue_date <= end_date)
            expense_breakdown = expense_breakdown.filter(Expense.date <= end_date)

        if group_by == "month":
            revenue_breakdown = revenue_breakdown.group_by('year', 'month').order_by('year', 'month')
            expense_breakdown = expense_breakdown.group_by('year', 'month').order_by('year', 'month')
        else:
            revenue_breakdown = revenue_breakdown.group_by('year', 'month', 'day').order_by('year', 'month', 'day')
            expense_breakdown = expense_breakdown.group_by('year', 'month', 'day').order_by('year', 'month', 'day')

        revenue_data = revenue_breakdown.all()
        expense_data = expense_breakdown.all()

        # Combine data
        from collections import defaultdict
        combined_data = defaultdict(lambda: {"revenue": 0, "expenses": 0})

        for r in revenue_data:
            key = f"{int(r.year)}-{int(r.month)}"
            if group_by == "day":
                key += f"-{int(r.day)}"
            combined_data[key]["revenue"] = float(r.revenue or 0)

        for e in expense_data:
            key = f"{int(e.year)}-{int(e.month)}"
            if group_by == "day":
                key += f"-{int(e.day)}"
            combined_data[key]["expenses"] = float(e.expenses or 0)

        for period, data in combined_data.items():
            profit = data["revenue"] - data["expenses"]
            margin = (profit / data["revenue"] * 100) if data["revenue"] > 0 else 0
            
            parts = period.split('-')
            monthly_data.append({
                "period": period,
                "revenue": data["revenue"],
                "expenses": data["expenses"],
                "profit": profit,
                "profit_margin": margin
            })

    return {
        "summary": {
            "total_revenue": float(total_revenue),
            "total_expenses": float(total_expenses),
            "total_profit": float(total_profit),
            "profit_margin": float(profit_margin),
            "currency": current_user.base_currency
        },
        "monthly_data": monthly_data
    }

@router.get("/tax-deductible-expenses")
async def get_tax_deductible_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tax_year: int = None,
):
    """Get tax-deductible expenses summary"""
    if not tax_year:
        tax_year = datetime.now().year

    # Define tax-deductible categories
    deductible_categories = [
        "Office Supplies", "Software & Subscriptions", "Hardware & Equipment",
        "Travel & Transportation", "Professional Services", "Marketing & Advertising",
        "Rent & Utilities", "Taxes & Fees", "Bank Charges", "Insurance"
    ]

    # Get expenses for the tax year
    start_date = datetime(tax_year, 1, 1).date()
    end_date = datetime(tax_year, 12, 31).date()

    query = db.query(
        ExpenseCategory.name.label("category"),
        ExpenseCategory.color.label("color"),
        func.sum(Expense.base_currency_amount).label("total_amount"),
        func.count(Expense.id).label("expense_count")
    ).join(Expense, ExpenseCategory.id == Expense.category_id).filter(
        Expense.created_by == current_user.id,
        Expense.date >= start_date,
        Expense.date <= end_date,
        ExpenseCategory.name.in_(deductible_categories)
    ).group_by(ExpenseCategory.name, ExpenseCategory.color)

    result = query.order_by(func.sum(Expense.base_currency_amount).desc()).all()

    total_deductible = sum(float(r.total_amount or 0) for r in result)

    return {
        "tax_year": tax_year,
        "total_deductible": float(total_deductible),
        "currency": current_user.base_currency,
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
