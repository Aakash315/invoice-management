from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List
from app.schemas.client import ClientResponse

class RecurringInvoiceTemplateItemBase(BaseModel):
    description: str
    quantity: int
    rate: float

class RecurringInvoiceTemplateItemCreate(RecurringInvoiceTemplateItemBase):
    pass

class RecurringInvoiceTemplateItemResponse(RecurringInvoiceTemplateItemBase):
    id: int
    amount: float
    sort_order: int
    
    model_config = ConfigDict(
        from_attributes = True
    )

class RecurringInvoiceBase(BaseModel):
    template_name: str
    client_id: int
    frequency: str  # daily, weekly, monthly, quarterly, yearly
    interval_value: int = 1
    day_of_week: Optional[int] = None  # 0=Monday, 6=Sunday for weekly
    day_of_month: Optional[int] = None  # 1-31 for monthly
    start_date: date
    end_date: Optional[date] = None
    occurrences_limit: Optional[int] = None
    is_active: bool = True
    auto_send: bool = False
    email_subject: Optional[str] = None
    email_message: Optional[str] = None

class RecurringInvoiceCreate(RecurringInvoiceBase):
    items: List[RecurringInvoiceTemplateItemCreate]

class RecurringInvoiceUpdate(BaseModel):
    template_name: Optional[str] = None
    client_id: Optional[int] = None
    frequency: Optional[str] = None
    interval_value: Optional[int] = None
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    occurrences_limit: Optional[int] = None
    is_active: Optional[bool] = None
    auto_send: Optional[bool] = None
    email_subject: Optional[str] = None
    email_message: Optional[str] = None
    items: Optional[List[RecurringInvoiceTemplateItemCreate]] = None

class RecurringInvoiceResponse(RecurringInvoiceBase):
    id: int
    current_occurrence: int
    generation_count: int
    failed_generations: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    last_generated_at: Optional[datetime] = None
    next_due_date: date
    client: Optional[ClientResponse] = None
    template_items: Optional[List[RecurringInvoiceTemplateItemResponse]] = None
    
    model_config = ConfigDict(
        from_attributes = True
    )

class RecurringInvoiceListResponse(BaseModel):
    id: int
    template_name: str
    frequency: str
    interval_value: int
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    start_date: date
    end_date: Optional[date] = None
    is_active: bool
    auto_send: bool
    generation_count: int
    failed_generations: int
    next_due_date: date
    created_at: datetime
    client: Optional[ClientResponse] = None
    
    model_config = ConfigDict(
        from_attributes = True
    )

class RecurringInvoiceHistoryItem(BaseModel):
    id: int
    invoice_number: str
    issue_date: date
    due_date: date
    total_amount: float
    status: str
    payment_status: str
    generated_at: datetime
    client: Optional[ClientResponse] = None
    
    model_config = ConfigDict(
        from_attributes = True
    )

class RecurringInvoicePreview(BaseModel):
    next_due_dates: List[date]
    template_name: str
    frequency: str
    interval_value: int
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None

class RecurringInvoiceStats(BaseModel):
    total_templates: int
    active_templates: int
    inactive_templates: int
    total_generated: int
    total_failed: int
    templates_with_auto_send: int
