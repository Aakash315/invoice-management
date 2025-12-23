from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.database import Base
import enum

class RecurrenceFrequency(enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"

class RecurringInvoice(Base):
    __tablename__ = "recurring_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(200), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    # Recurrence Configuration
    frequency = Column(String(20), nullable=False)  # daily, weekly, monthly, quarterly, yearly
    interval_value = Column(Integer, default=1, nullable=False)  # every N units
    day_of_week = Column(Integer, nullable=True)  # 0=Monday, 6=Sunday for weekly
    day_of_month = Column(Integer, nullable=True)  # 1-31 for monthly
    
    # Date Configuration
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    occurrences_limit = Column(Integer, nullable=True)  # optional limit
    current_occurrence = Column(Integer, default=0, nullable=False)
    
    # Status and Control
    is_active = Column(Boolean, default=True, nullable=False)
    auto_send = Column(Boolean, default=False, nullable=False)
    generation_count = Column(Integer, default=0, nullable=False)  # how many times generated
    failed_generations = Column(Integer, default=0, nullable=False)  # failed attempts
    
    # Email Configuration
    email_subject = Column(String(255), nullable=True)
    email_message = Column(Text, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_generated_at = Column(DateTime, nullable=True)
    next_due_date = Column(Date, nullable=False)
    
    # Relationships
    client = relationship("Client", back_populates="recurring_invoices")
    created_by_user = relationship("User", back_populates="recurring_invoices")
    template_items = relationship("RecurringInvoiceTemplateItem", back_populates="recurring_invoice", cascade="all, delete-orphan")
    generated_invoices = relationship("Invoice", back_populates="template", foreign_keys="Invoice.template_id")

class RecurringInvoiceTemplateItem(Base):
    __tablename__ = "recurring_invoice_template_items"
    
    id = Column(Integer, primary_key=True, index=True)
    recurring_invoice_id = Column(Integer, ForeignKey("recurring_invoices.id"), nullable=False)
    description = Column(String(500), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    
    # Relationship
    recurring_invoice = relationship("RecurringInvoice", back_populates="template_items")
