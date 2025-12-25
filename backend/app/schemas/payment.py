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
    gateway_payment_id: Optional[str] = None # Added for payment gateway
    gateway_name: Optional[str] = None # Added for payment gateway

    created_at: datetime
    
    class Config:
        from_attributes = True
        exclude = {'invoice'}

# --- New Schemas for Razorpay ---
class RazorpayOrderCreate(BaseModel):
    invoice_id: int
    amount: float # Amount in base currency, will be converted to smallest unit (e.g., paisa)

class RazorpayOrderResponse(BaseModel):
    order_id: str
    currency: str
    amount: float # Amount in smallest unit (e.g., paisa)
    invoice_id: int
    key_id: str
    client_name: str
    client_email: str
    client_phone: Optional[str] = None

# --- New Schemas for PayPal ---
class PayPalOrderCreate(BaseModel):
    invoice_id: int
    amount: float

class PayPalOrderResponse(BaseModel):
    order_id: str
    approve_url: str

class PayPalCaptureRequest(BaseModel):
    order_id: str
    invoice_id: int # To ensure the payment is for the correct invoice
