from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    # Invoice Details
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    
    # Financial Details
    subtotal = Column(Float, default=0.0)
    tax_rate = Column(Float, default=18.0)
    tax_amount = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    
    # Status
    status = Column(String(20), default="draft")
    payment_status = Column(String(20), default="unpaid")
    paid_amount = Column(Float, default=0.0)
    
    # Additional Info
    notes = Column(Text)
    terms = Column(Text)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    client = relationship("Client", back_populates="invoices")
    created_by_user = relationship("User", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
    email_history = relationship("EmailHistory", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    description = Column(String(500), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    
    # Relationship
    invoice = relationship("Invoice", back_populates="items")