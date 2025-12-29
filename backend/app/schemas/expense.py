from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List
from app.schemas.expense_category import ExpenseCategoryResponse
from app.schemas.client import ClientResponse

class ExpenseBase(BaseModel):
    amount: float
    category_id: int
    date: date
    description: str
    vendor: Optional[str] = None
    payment_method: Optional[str] = None
    currency: str = "INR"
    exchange_rate: Optional[float] = None
    client_id: Optional[int] = None
    invoice_id: Optional[int] = None

class ExpenseCreate(ExpenseBase):
    receipt_file: Optional[str] = None

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category_id: Optional[int] = None
    date: Optional[date] = None
    description: Optional[str] = None
    vendor: Optional[str] = None
    payment_method: Optional[str] = None
    receipt_file: Optional[str] = None
    currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    client_id: Optional[int] = None
    invoice_id: Optional[int] = None

class ExpenseResponse(ExpenseBase):
    id: int
    receipt_file: Optional[str] = None
    base_currency_amount: Optional[float] = None
    category: Optional[ExpenseCategoryResponse] = None
    client: Optional[ClientResponse] = None
    
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes = True,
        exclude = {'created_by_user'}
    )

class ExpenseSummary(BaseModel):
    total_expenses: float
    expense_count: int
    by_category: List[dict]
    by_payment_method: List[dict]
    monthly_expenses: List[dict]
    currency: str

class ExpenseFilter(BaseModel):
    category_id: Optional[int] = None
    client_id: Optional[int] = None
    invoice_id: Optional[int] = None
    payment_method: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    search: Optional[str] = None
