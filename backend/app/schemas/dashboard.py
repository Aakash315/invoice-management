from pydantic import BaseModel
from typing import List
from app.schemas.invoice import InvoiceResponse

class ClientDashboardResponse(BaseModel):
    outstanding_amount: float
    total_invoices: int
    recent_invoices: List[InvoiceResponse]
