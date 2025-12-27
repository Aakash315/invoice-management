from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field

# Shared base for ReminderSetting
class ReminderSettingBase(BaseModel):
    remind_before_due: List[int] = Field(default_factory=lambda: [7, 3, 1])
    remind_on_due: bool = True
    remind_after_due: List[int] = Field(default_factory=lambda: [1, 7, 15, 30])
    template_friendly: Optional[str] = None
    template_due: Optional[str] = None
    template_first_overdue: Optional[str] = None
    template_second_overdue: Optional[str] = None
    template_final_notice: Optional[str] = None
    enabled: bool = False

# Schema for creating/updating reminder settings
class ReminderSettingCreate(ReminderSettingBase):
    pass

class ReminderSettingUpdate(ReminderSettingBase):
    pass

# Schema for reading reminder settings
class ReminderSetting(ReminderSettingBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Shared base for ReminderHistory
class ReminderHistoryBase(BaseModel):
    invoice_id: int
    sent_at: datetime
    reminder_type: str
    recipient_email: str
    email_subject: str
    email_body: str

# Schema for reading reminder history
class ReminderHistory(ReminderHistoryBase):
    id: int

    class Config:
        orm_mode = True
