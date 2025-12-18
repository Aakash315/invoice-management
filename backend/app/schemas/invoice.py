from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List
from app.schemas.client import ClientResponse

class InvoiceItemBase(BaseModel):
    description: str
    quantity: int
    rate: float

class InvoiceItemCreate(InvoiceItemBase):
    pass



class InvoiceItemResponse(InvoiceItemBase):
    id: int
    amount: float
    
    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    client_id: int
    issue_date: date
    due_date: date
    tax_rate: float = 18.0
    discount: float = 0.0
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: str = "draft"

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None



class InvoiceResponse(InvoiceBase):
    id: int
    invoice_number: str
    subtotal: float
    tax_amount: float
    total_amount: float
    payment_status: str
    paid_amount: float
    balance: float
    client: Optional[ClientResponse] = None
    items: Optional[List[InvoiceItemResponse]] = None

    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        exclude = {'created_by_user', 'payments'}
