from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Client(Base):
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    company = Column(String(200))
    email = Column(String(120), nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    gstin = Column(String(15))
    base_currency = Column(String(10), nullable=False, default='INR')
    password_hash = Column(String, nullable=True) # Added for client portal authentication
    is_portal_enabled = Column(Boolean, default=False) # Added to control portal access
    reset_password_token = Column(String(255), nullable=True)
    reset_password_expires = Column(DateTime, nullable=True)
    document_type = Column(String(50), nullable=True)
    document_path = Column(String(500), nullable=True)
    # Deposit fields
    has_deposit = Column(Boolean, default=False)
    deposit_amount = Column(Float, nullable=True)
    deposit_date = Column(Date, nullable=True)
    deposit_type = Column(String(50), nullable=True) # Cash, Bank Transfer, Cheque, UPI, Other
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by_user = relationship("User", back_populates="clients")
    invoices = relationship("Invoice", back_populates="client", cascade="all, delete-orphan")
    recurring_invoices = relationship("RecurringInvoice", back_populates="client", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="client", cascade="all, delete-orphan")
    deposit_returns = relationship("DepositReturnHistory", back_populates="client", cascade="all, delete-orphan")


class DepositReturnHistory(Base):
    __tablename__ = "deposit_return_history"
    
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    amount = Column(Float, nullable=False)
    returned_date = Column(DateTime, default=datetime.utcnow)
    returned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    return_type = Column(String(50), nullable=True) # Cash, Bank Transfer, UPI, Cheque, Other
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    client = relationship("Client", back_populates="deposit_returns")
    returned_by_user = relationship("User", back_populates="deposit_returns")
