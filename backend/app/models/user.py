from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # admin, user
    base_currency = Column(String(10), default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    clients = relationship("Client", back_populates="created_by_user")
    invoices = relationship("Invoice", back_populates="created_by_user")
    recurring_invoices = relationship("RecurringInvoice", back_populates="created_by_user")
    reminder_setting = relationship("ReminderSetting", back_populates="user", uselist=False)
    invoice_templates = relationship("InvoiceTemplate", back_populates="user")
    template_defaults = relationship("UserTemplateDefault", back_populates="user")
    expenses = relationship("Expense", back_populates="created_by_user")
    expense_categories = relationship("ExpenseCategory", back_populates="created_by_user")
