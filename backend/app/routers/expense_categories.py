from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.expense_category import ExpenseCategory
from app.models.user import User
from app.schemas.expense_category import ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseCategoryResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/expense-categories", tags=["Expense Categories"])

@router.get("", response_model=List[ExpenseCategoryResponse])
async def get_expense_categories(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all expense categories for the current user"""
    query = db.query(ExpenseCategory).filter(ExpenseCategory.created_by == current_user.id)
    
    if not include_inactive:
        query = query.filter(ExpenseCategory.is_active == True)
    
    categories = query.order_by(ExpenseCategory.name).all()
    return categories

@router.post("", response_model=ExpenseCategoryResponse)
async def create_expense_category(
    category_data: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new expense category"""
    # Check if category name already exists for this user
    existing = db.query(ExpenseCategory).filter(
        ExpenseCategory.name == category_data.name,
        ExpenseCategory.created_by == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    # Create category
    db_category = ExpenseCategory(
        **category_data.dict(),
        created_by=current_user.id
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.get("/{category_id}", response_model=ExpenseCategoryResponse)
async def get_expense_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific expense category"""
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == category_id,
        ExpenseCategory.created_by == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category

@router.put("/{category_id}", response_model=ExpenseCategoryResponse)
async def update_expense_category(
    category_id: int,
    category_data: ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an expense category"""
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == category_id,
        ExpenseCategory.created_by == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts with existing category
    if category_data.name:
        existing = db.query(ExpenseCategory).filter(
            ExpenseCategory.name == category_data.name,
            ExpenseCategory.created_by == current_user.id,
            ExpenseCategory.id != category_id
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Category with this name already exists")
    
    # Update fields
    update_data = category_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    category.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(category)
    
    return category

@router.delete("/{category_id}")
async def delete_expense_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an expense category"""
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == category_id,
        ExpenseCategory.created_by == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has associated expenses
    from app.models.expense import Expense
    expense_count = db.query(Expense).filter(Expense.category_id == category_id).count()
    
    if expense_count > 0:
        # Instead of deleting, mark as inactive
        category.is_active = False
        category.updated_at = datetime.utcnow()
        db.commit()
        return {"message": f"Category has {expense_count} associated expenses and has been deactivated"}
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}

@router.post("/{category_id}/toggle-active")
async def toggle_category_active(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle category active status"""
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == category_id,
        ExpenseCategory.created_by == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.is_active = not category.is_active
    category.updated_at = datetime.utcnow()
    
    db.commit()
    
    status = "activated" if category.is_active else "deactivated"
    return {"message": f"Category {status} successfully"}

@router.get("/{category_id}/usage-stats")
async def get_category_usage_stats(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get usage statistics for a category"""
    category = db.query(ExpenseCategory).filter(
        ExpenseCategory.id == category_id,
        ExpenseCategory.created_by == current_user.id
    ).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    from app.models.expense import Expense
    from sqlalchemy import func
    
    # Get expense count and total amount
    stats = db.query(
        func.count(Expense.id).label('expense_count'),
        func.sum(Expense.base_currency_amount).label('total_amount')
    ).filter(
        Expense.category_id == category_id,
        Expense.created_by == current_user.id
    ).first()
    
    return {
        "category_id": category_id,
        "category_name": category.name,
        "expense_count": stats.expense_count or 0,
        "total_amount": float(stats.total_amount or 0.0),
        "is_active": category.is_active
    }
