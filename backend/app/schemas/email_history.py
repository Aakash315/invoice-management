from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum

class EmailStatusEnum(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    OPENED = "opened"
    BOUNCED = "bounced"
    FAILED = "failed"

class EmailHistoryBase(BaseModel):
    recipient: Optional[str] = None
    subject: Optional[str] = None
    body_preview: Optional[str] = None
    attachment_filename: Optional[str] = None
    status: Optional[EmailStatusEnum] = None

class EmailHistoryCreate(EmailHistoryBase):
    cc: Optional[str] = None
    bcc: Optional[str] = None
    invoice_id: int
    sent_to: Optional[str] = None  # For backward compatibility

class EmailHistoryResponse(EmailHistoryBase):
    id: int
    invoice_id: int
    sent_at: datetime
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    bounced_at: Optional[datetime] = None
    error_message: Optional[str] = None
    delivery_error: Optional[str] = None
    tracking_id: Optional[str] = None
    sent_to: Optional[str] = None  # For backward compatibility
    
    # Additional computed fields for frontend
    status_display: Optional[str] = None
    status_color: Optional[str] = None
    formatted_sent_time: Optional[str] = None
    model_config = ConfigDict(
        from_attributes = True
    )

class EmailHistoryList(BaseModel):
    total: int
    emails: List[EmailHistoryResponse]
    
    model_config = ConfigDict(
        from_attributes = True
    )

