from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
from app.database import get_db
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseSummary, ExpenseFilter
from app.utils.dependencies import get_current_user
from datetime import datetime, date

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("", response_model=List[ExpenseResponse])
async def get_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    invoice_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get expenses with optional filtering"""
    query = db.query(Expense).options(
        joinedload(Expense.category),
        joinedload(Expense.client)
    ).filter(Expense.created_by == current_user.id)
    
    # Apply filters
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if client_id:
        query = query.filter(Expense.client_id == client_id)
    if invoice_id:
        query = query.filter(Expense.invoice_id == invoice_id)
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
    
    expenses = query.order_by(Expense.date.desc()).offset(skip).limit(limit).all()
    return expenses

@router.post("", response_model=ExpenseResponse)
async def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new expense"""
    # Verify category exists and belongs to user
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == expense_data.category_id,
        ExpenseCategory.created_by == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Calculate base currency amount if different currency
    base_currency_amount = expense_data.amount
    if expense_data.currency != current_user.base_currency and expense_data.exchange_rate:
        base_currency_amount = expense_data.amount * expense_data.exchange_rate
    
    # Create expense
    db_expense = Expense(
        **expense_data.dict(),
        base_currency_amount=base_currency_amount,
        created_by=current_user.id
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Load relationships for response
    db_expense = db.query(Expense).options(
        joinedload(Expense.category),
        joinedload(Expense.client)
    ).filter(Expense.id == db_expense.id).first()
    
    return db_expense

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific expense"""
    expense = db.query(Expense).options(
        joinedload(Expense.category),
        joinedload(Expense.client),
        joinedload(Expense.invoice)
    ).filter(
        Expense.id == expense_id,
        Expense.created_by == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an expense"""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.created_by == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Verify category exists if being updated
    if expense_data.category_id:
        category = db.query(ExpenseCategory).filter(
            ExpenseCategory.id == expense_data.category_id,
            ExpenseCategory.created_by == current_user.id
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
    
    # Update fields
    update_data = expense_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)
    
    # Recalculate base currency amount if currency or amount changed
    if 'currency' in update_data or 'amount' in update_data:
        if expense.currency != current_user.base_currency and expense.exchange_rate:
            expense.base_currency_amount = expense.amount * expense.exchange_rate
        else:
            expense.base_currency_amount = expense.amount
    
    expense.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(expense)
    
    # Load relationships for response
    expense = db.query(Expense).options(
        joinedload(Expense.category),
        joinedload(Expense.client)
    ).filter(Expense.id == expense.id).first()
    
    return expense

@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an expense"""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.created_by == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    
    return {"message": "Expense deleted successfully"}

@router.get("/summary/overview", response_model=ExpenseSummary)
async def get_expense_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get expense summary statistics"""
    query = db.query(Expense).filter(Expense.created_by == current_user.id)
    
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    
    expenses = query.all()
    
    # Calculate totals
    total_expenses = sum(expense.base_currency_amount or expense.amount for expense in expenses)
    expense_count = len(expenses)
    
    # Group by category
    category_stats = db.query(
        ExpenseCategory.name,
        func.sum(Expense.base_currency_amount).label('total')
    ).join(Expense).filter(
        Expense.created_by == current_user.id
    ).group_by(ExpenseCategory.name).all()
    
    by_category = [
        {"category": stat.name, "amount": float(stat.total or 0.0)}
        for stat in category_stats
    ]
    
    # Group by payment method
    payment_stats = db.query(
        Expense.payment_method,
        func.sum(Expense.base_currency_amount).label('total')
    ).filter(
        Expense.created_by == current_user.id
    ).group_by(Expense.payment_method).all()
    
    by_payment_method = [
        {"method": stat.payment_method or "Unknown", "amount": float(stat.total or 0.0)}
        for stat in payment_stats
    ]
    
    # Monthly expenses (last 6 months)
    from sqlalchemy import extract
    monthly_stats = db.query(
        extract('month', Expense.date).label('month'),
        extract('year', Expense.date).label('year'),
        func.sum(Expense.base_currency_amount).label('total')
    ).filter(
        Expense.created_by == current_user.id
    ).group_by('month', 'year').order_by('year', 'month').all()
    
    monthly_expenses = [
        {"month": int(stat.month), "year": int(stat.year), "amount": float(stat.total or 0.0)}
        for stat in monthly_stats
    ]
    
    return ExpenseSummary(
        total_expenses=float(total_expenses),
        expense_count=expense_count,
        by_category=by_category,
        by_payment_method=by_payment_method,
        monthly_expenses=monthly_expenses,
        currency=current_user.base_currency
    )

@router.get("/export/csv")
async def export_expenses_csv(
    category_id: Optional[int] = Query(None),
    client_id: Optional[int] = Query(None),
    invoice_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export expenses to CSV format"""
    query = db.query(Expense).options(
        joinedload(Expense.category),
        joinedload(Expense.client)
    ).filter(Expense.created_by == current_user.id)
    
    # Apply filters
    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if client_id:
        query = query.filter(Expense.client_id == client_id)
    if invoice_id:
        query = query.filter(Expense.invoice_id == invoice_id)
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
    
    expenses = query.order_by(Expense.date.desc()).all()
    
    # Create CSV content
    import csv
    from io import StringIO
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'Date', 'Description', 'Amount', 'Currency', 'Category', 
        'Vendor', 'Payment Method', 'Client', 'Receipt File'
    ])
    
    # Data rows
    for expense in expenses:
        writer.writerow([
            expense.date.strftime('%Y-%m-%d'),
            expense.description,
            expense.amount,
            expense.currency,
            expense.category.name if expense.category else '',
            expense.vendor or '',
            expense.payment_method or '',
            expense.client.name if expense.client else '',
            expense.receipt_file or ''
        ])
    
    csv_content = output.getvalue()
    output.close()
    
    from fastapi.responses import StreamingResponse
    import io

    response = StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
    )
    response.headers["Content-Disposition"] = f"attachment; filename=expenses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return response
