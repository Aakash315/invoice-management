from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ReminderSetting(Base):
    __tablename__ = "reminder_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Reminder schedule in days
    remind_before_due = Column(Text, default="[7, 3, 1]")  # Storing JSON as string
    remind_on_due = Column(Boolean, default=True)
    remind_after_due = Column(Text, default="[1, 7, 15, 30]") # Storing JSON as string

    # Email templates
    template_friendly = Column(Text, nullable=True)
    template_due = Column(Text, nullable=True)
    template_first_overdue = Column(Text, nullable=True)
    template_second_overdue = Column(Text, nullable=True)
    template_final_notice = Column(Text, nullable=True)

    enabled = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="reminder_setting")

class ReminderHistory(Base):
    __tablename__ = "reminder_history"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    reminder_type = Column(String(50), nullable=False) # e.g., "friendly", "due", "first_overdue", etc.
    recipient_email = Column(String, nullable=False)
    email_subject = Column(String, nullable=False)
    email_body = Column(Text, nullable=False)

    invoice = relationship("Invoice", back_populates="reminder_history")
