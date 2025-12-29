from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String(500), nullable=False)
    vendor = Column(String(200))
    payment_method = Column(String(50))  # Cash, Credit Card, Bank Transfer, etc.
    receipt_file = Column(String(500))  # Path to uploaded receipt file
    
    # Optional links to other entities
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)  # For project-specific expenses
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)  # For invoice-related expenses
    
    # Multi-currency support
    currency = Column(String(10), default="INR")
    base_currency_amount = Column(Float)  # Converted amount in user's base currency
    exchange_rate = Column(Float)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = relationship("User", back_populates="expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")
    client = relationship("Client", back_populates="expenses")
    invoice = relationship("Invoice", back_populates="expenses")
