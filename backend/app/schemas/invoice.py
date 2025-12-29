from pydantic import BaseModel, ConfigDict # Import ConfigDict
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
    
    model_config = ConfigDict( # Use ConfigDict
        from_attributes = True
    )

class InvoiceBase(BaseModel):
    client_id: int
    issue_date: date
    due_date: date
    tax_rate: float = 18.0
    discount: float = 0.0
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: str = "draft"
    currency: str = "INR"
    design_template_id: Optional[int] = None

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]
    exchange_rate: Optional[float] = None


class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    tax_rate: Optional[float] = None
    discount: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    items: Optional[List[InvoiceItemCreate]] = None
    currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    design_template_id: Optional[int] = None



class InvoiceResponse(InvoiceBase):
    id: int
    invoice_number: str
    subtotal: float
    tax_amount: float
    total_amount: float
    payment_status: str
    paid_amount: float
    balance: float
    design_template_id: Optional[int] = None
    client: Optional[ClientResponse] = None
    items: Optional[List[InvoiceItemResponse]] = None
    template_config: Optional[dict] = None

    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict( # Use ConfigDict
        from_attributes = True,
        exclude = {'created_by_user', 'payments'}
    )
