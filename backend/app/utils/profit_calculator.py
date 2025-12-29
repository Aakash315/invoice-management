from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract
from typing import List, Optional, Dict, Any, Tuple
from datetime import date, datetime, timedelta
from app.models.invoice import Invoice
from app.models.expense import Expense
from app.models.user import User
from app.models.client import Client

def calculate_profit_summary(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    base_currency: str = "INR"
) -> Dict[str, Any]:
    """Calculate comprehensive profit summary"""
    
    # Get revenue from invoices
    revenue_query = db.query(
        func.sum(Invoice.base_currency_amount).label("total_revenue")
    ).filter(
        Invoice.status.in_(["paid", "sent", "overdue"]),
        Invoice.created_by == user_id
    )
    
    if start_date:
        revenue_query = revenue_query.filter(Invoice.issue_date >= start_date)
    if end_date:
        revenue_query = revenue_query.filter(Invoice.issue_date <= end_date)
    
    total_revenue = revenue_query.scalar() or 0.0
    
    # Get expenses
    expense_query = db.query(
        func.sum(Expense.base_currency_amount).label("total_expenses")
    ).filter(
        Expense.created_by == user_id
    )
    
    if start_date:
        expense_query = expense_query.filter(Expense.date >= start_date)
    if end_date:
        expense_query = expense_query.filter(Expense.date <= end_date)
    
    total_expenses = expense_query.scalar() or 0.0
    
    # Calculate profit metrics
    total_profit = total_revenue - total_expenses
    profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
    expense_ratio = (total_expenses / total_revenue * 100) if total_revenue > 0 else 0
    
    # Get invoice and expense counts
    invoice_count = db.query(func.count(Invoice.id)).filter(
        Invoice.status.in_(["paid", "sent", "overdue"]),
        Invoice.created_by == user_id
    ).scalar() or 0
    
    expense_count = db.query(func.count(Expense.id)).filter(
        Expense.created_by == user_id
    ).scalar() or 0
    
    # Calculate averages
    avg_revenue_per_invoice = total_revenue / invoice_count if invoice_count > 0 else 0
    avg_expense_per_transaction = total_expenses / expense_count if expense_count > 0 else 0
    
    return {
        "summary": {
            "total_revenue": float(total_revenue),
            "total_expenses": float(total_expenses),
            "total_profit": float(total_profit),
            "profit_margin": float(profit_margin),
            "expense_ratio": float(expense_ratio),
            "invoice_count": invoice_count,
            "expense_count": expense_count,
            "avg_revenue_per_invoice": float(avg_revenue_per_invoice),
            "avg_expense_per_transaction": float(avg_expense_per_transaction),
            "currency": base_currency
        }
    }

def calculate_monthly_profit(
    db: Session,
    user_id: int,
    months_back: int = 12,
    base_currency: str = "INR"
) -> List[Dict[str, Any]]:
    """Calculate profit data for the last N months"""
    
    # Calculate date range
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=months_back * 30)
    
    # Get revenue by month
    revenue_query = db.query(
        extract('year', Invoice.issue_date).label('year'),
        extract('month', Invoice.issue_date).label('month'),
        func.sum(Invoice.base_currency_amount).label('revenue')
    ).filter(
        Invoice.status.in_(["paid", "sent", "overdue"]),
        Invoice.created_by == user_id,
        Invoice.issue_date >= start_date
    ).group_by('year', 'month').order_by('year', 'month')
    
    revenue_data = revenue_query.all()
    
    # Get expenses by month
    expense_query = db.query(
        extract('year', Expense.date).label('year'),
        extract('month', Expense.date).label('month'),
        func.sum(Expense.base_currency_amount).label('expenses')
    ).filter(
        Expense.created_by == user_id,
        Expense.date >= start_date
    ).group_by('year', 'month').order_by('year', 'month')
    
    expense_data = expense_query.all()
    
    # Combine data
    from collections import defaultdict
    monthly_data = defaultdict(lambda: {"revenue": 0, "expenses": 0})
    
    for r in revenue_data:
        key = f"{int(r.year)}-{int(r.month):02d}"
        monthly_data[key]["revenue"] = float(r.revenue or 0)
    
    for e in expense_data:
        key = f"{int(e.year)}-{int(e.month):02d}"
        monthly_data[key]["expenses"] = float(e.expenses or 0)
    
    # Create result list
    result = []
    current_date = start_date.replace(day=1)
    
    while current_date <= end_date:
        key = f"{current_date.year}-{current_date.month:02d}"
        data = monthly_data[key]
        profit = data["revenue"] - data["expenses"]
        margin = (profit / data["revenue"] * 100) if data["revenue"] > 0 else 0
        
        result.append({
            "year": current_date.year,
            "month": current_date.month,
            "month_name": current_date.strftime("%B"),
            "revenue": data["revenue"],
            "expenses": data["expenses"],
            "profit": profit,
            "profit_margin": margin,
            "currency": base_currency
        })
        
        # Move to next month
        if current_date.month == 12:
            current_date = current_date.replace(year=current_date.year + 1, month=1)
        else:
            current_date = current_date.replace(month=current_date.month + 1)
    
    return result

def calculate_profit_by_client(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Calculate profit by client (revenue from invoices - expenses per client)"""
    
    # Get client revenue
    revenue_query = db.query(
        Client.id.label("client_id"),
        Client.name.label("client_name"),
        func.sum(Invoice.base_currency_amount).label("revenue")
    ).join(Invoice, Client.id == Invoice.client_id).filter(
        Invoice.status.in_(["paid", "sent", "overdue"]),
        Invoice.created_by == user_id
    ).group_by(Client.id, Client.name)
    
    if start_date:
        revenue_query = revenue_query.filter(Invoice.issue_date >= start_date)
    if end_date:
        revenue_query = revenue_query.filter(Invoice.issue_date <= end_date)
    
    revenue_data = revenue_query.all()
    
    # Get client expenses
    expense_query = db.query(
        Client.id.label("client_id"),
        Client.name.label("client_name"),
        func.sum(Expense.base_currency_amount).label("expenses")
    ).join(Expense, Client.id == Expense.client_id).filter(
        Expense.created_by == user_id
    ).group_by(Client.id, Client.name)
    
    if start_date:
        expense_query = expense_query.filter(Expense.date >= start_date)
    if end_date:
        expense_query = expense_query.filter(Expense.date <= end_date)
    
    expense_data = expense_query.all()
    
    # Combine data
    from collections import defaultdict
    client_data = defaultdict(lambda: {"revenue": 0, "expenses": 0, "client_name": ""})
    
    for r in revenue_data:
        client_data[r.client_id]["revenue"] = float(r.revenue or 0)
        client_data[r.client_id]["client_name"] = r.client_name
    
    for e in expense_data:
        client_data[e.client_id]["expenses"] = float(e.expenses or 0)
        if not client_data[e.client_id]["client_name"]:
            client_data[e.client_id]["client_name"] = e.client_name
    
    # Calculate profit and create result
    result = []
    for client_id, data in client_data.items():
        profit = data["revenue"] - data["expenses"]
        margin = (profit / data["revenue"] * 100) if data["revenue"] > 0 else 0
        
        result.append({
            "client_id": client_id,
            "client_name": data["client_name"],
            "revenue": data["revenue"],
            "expenses": data["expenses"],
            "profit": profit,
            "profit_margin": margin
        })
    
    # Sort by profit descending and limit
    result.sort(key=lambda x: x["profit"], reverse=True)
    return result[:limit]

def calculate_quarterly_profit(
    db: Session,
    user_id: int,
    year: int,
    base_currency: str = "INR"
) -> List[Dict[str, Any]]:
    """Calculate quarterly profit for a specific year"""
    
    quarters = [
        (1, 3),   # Q1: Jan-Mar
        (4, 6),   # Q2: Apr-Jun
        (7, 9),   # Q3: Jul-Sep
        (10, 12)  # Q4: Oct-Dec
    ]
    
    result = []
    
    for quarter, (start_month, end_month) in enumerate(quarters, 1):
        start_date = date(year, start_month, 1)
        end_date = date(year, end_month, 31)
        
        # Revenue for quarter
        revenue = db.query(func.sum(Invoice.base_currency_amount)).filter(
            Invoice.status.in_(["paid", "sent", "overdue"]),
            Invoice.created_by == user_id,
            Invoice.issue_date >= start_date,
            Invoice.issue_date <= end_date
        ).scalar() or 0.0
        
        # Expenses for quarter
        expenses = db.query(func.sum(Expense.base_currency_amount)).filter(
            Expense.created_by == user_id,
            Expense.date >= start_date,
            Expense.date <= end_date
        ).scalar() or 0.0
        
        profit = revenue - expenses
        margin = (profit / revenue * 100) if revenue > 0 else 0
        
        result.append({
            "quarter": quarter,
            "quarter_name": f"Q{quarter} {year}",
            "start_month": start_month,
            "end_month": end_month,
            "revenue": float(revenue),
            "expenses": float(expenses),
            "profit": float(profit),
            "profit_margin": float(margin),
            "currency": base_currency
        })
    
    return result

def calculate_yoy_profit_growth(
    db: Session,
    user_id: int,
    base_currency: str = "INR"
) -> Dict[str, Any]:
    """Calculate year-over-year profit growth"""
    
    current_year = datetime.now().year
    previous_year = current_year - 1
    
    # Current year profit
    current_summary = calculate_profit_summary(
        db, user_id,
        date(current_year, 1, 1),
        date(current_year, 12, 31),
        base_currency
    )
    
    # Previous year profit
    previous_summary = calculate_profit_summary(
        db, user_id,
        date(previous_year, 1, 1),
        date(previous_year, 12, 31),
        base_currency
    )
    
    current_profit = current_summary["summary"]["total_profit"]
    previous_profit = previous_summary["summary"]["total_profit"]
    
    # Calculate growth
    profit_growth = ((current_profit - previous_profit) / abs(previous_profit) * 100) if previous_profit != 0 else 0
    revenue_growth = (
        (current_summary["summary"]["total_revenue"] - previous_summary["summary"]["total_revenue"]) /
        previous_summary["summary"]["total_revenue"] * 100
    ) if previous_summary["summary"]["total_revenue"] != 0 else 0
    
    expense_growth = (
        (current_summary["summary"]["total_expenses"] - previous_summary["summary"]["total_expenses"]) /
        previous_summary["summary"]["total_expenses"] * 100
    ) if previous_summary["summary"]["total_expenses"] != 0 else 0
    
    return {
        "current_year": current_year,
        "previous_year": previous_year,
        "current_profit": current_profit,
        "previous_profit": previous_profit,
        "profit_growth": float(profit_growth),
        "revenue_growth": float(revenue_growth),
        "expense_growth": float(expense_growth),
        "currency": base_currency
    }

def get_profit_health_metrics(
    db: Session,
    user_id: int,
    base_currency: str = "INR"
) -> Dict[str, Any]:
    """Get overall profit health metrics"""
    
    # Get current year summary
    current_year = datetime.now().year
    summary = calculate_profit_summary(
        db, user_id,
        date(current_year, 1, 1),
        date(current_year, 12, 31),
        base_currency
    )
    
    profit = summary["summary"]["total_profit"]
    revenue = summary["summary"]["total_revenue"]
    margin = summary["summary"]["profit_margin"]
    
    # Determine health status
    if margin >= 20:
        health_status = "excellent"
        health_color = "green"
        health_message = "Excellent profitability"
    elif margin >= 10:
        health_status = "good"
        health_color = "blue"
        health_message = "Good profitability"
    elif margin >= 0:
        health_status = "fair"
        health_color = "yellow"
        health_message = "Break-even or modest profit"
    else:
        health_status = "poor"
        health_color = "red"
        health_message = "Loss-making - review expenses"
    
    # Get monthly trend (last 3 months)
    recent_months = calculate_monthly_profit(db, user_id, 3, base_currency)
    
    # Calculate trend
    if len(recent_months) >= 2:
        latest_margin = recent_months[-1]["profit_margin"]
        previous_margin = recent_months[-2]["profit_margin"]
        trend = "improving" if latest_margin > previous_margin else "declining" if latest_margin < previous_margin else "stable"
    else:
        trend = "insufficient_data"
    
    return {
        "health_status": health_status,
        "health_color": health_color,
        "health_message": health_message,
        "profit_margin": margin,
        "total_profit": profit,
        "trend": trend,
        "recent_months": recent_months,
        "currency": base_currency
    }
