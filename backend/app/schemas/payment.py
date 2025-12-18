from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class PaymentBase(BaseModel):
    amount: float
    payment_date: date
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    invoice_id: int

    created_at: datetime
    
    class Config:
        from_attributes = True
        exclude = {'invoice'}
