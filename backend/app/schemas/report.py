from pydantic import BaseModel
from typing import Optional

class RevenueReportItem(BaseModel):
    total_revenue: float
    year: int
    month: Optional[int] = None
    day: Optional[int] = None

    class Config:
        orm_mode = True

class TopClientReportItem(BaseModel):
    client_id: int
    client_name: str
    total_revenue: float

    class Config:
        orm_mode = True

class LatePayingClientsReportItem(BaseModel):
    client_id: int
    client_name: str
    overdue_invoices: int
    total_overdue_amount: float

    class Config:
        orm_mode = True
