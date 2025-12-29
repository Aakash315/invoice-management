from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class InvoiceTemplate(Base):
    __tablename__ = "invoice_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Template Information
    name = Column(String(255), nullable=False)
    description = Column(Text)
    template_type = Column(String(50), nullable=False)  # 'modern', 'classic', 'minimal', 'corporate'
    
    # Company Branding
    company_logo_url = Column(Text)
    company_name = Column(String(255))
    company_address = Column(Text)
    company_phone = Column(String(50))
    company_email = Column(String(255))
    
    # Color Scheme
    color_primary = Column(String(7), default="#2563eb")    # Hex color
    color_secondary = Column(String(7), default="#6b7280")  # Hex color
    color_accent = Column(String(7), default="#10b981")     # Hex color
    color_text = Column(String(7), default="#111827")       # Hex color
    color_background = Column(String(7), default="#ffffff") # Hex color
    
    # Typography
    font_family = Column(String(100), default="helvetica")
    font_size_base = Column(Integer, default=10)
    font_size_header = Column(Integer, default=16)
    font_size_title = Column(Integer, default=24)
    
    # Layout Settings
    header_style = Column(String(50), default="modern")  # 'modern', 'classic', 'minimal', 'corporate'
    item_table_style = Column(String(50), default="modern")  # 'modern', 'classic', 'minimal'
    totals_layout = Column(String(50), default="right")  # 'right', 'left'
    layout_columns = Column(String(20), default="single")  # 'single', 'two'
    
    # Field Visibility Settings
    show_invoice_number = Column(Boolean, default=True)
    show_issue_date = Column(Boolean, default=True)
    show_due_date = Column(Boolean, default=True)
    show_notes = Column(Boolean, default=True)
    show_terms = Column(Boolean, default=True)
    show_payment_instructions = Column(Boolean, default=True)
    show_company_logo = Column(Boolean, default=True)
    show_company_details = Column(Boolean, default=True)
    show_client_details = Column(Boolean, default=True)
    show_line_items = Column(Boolean, default=True)
    show_subtotal = Column(Boolean, default=True)
    show_tax = Column(Boolean, default=True)
    show_discount = Column(Boolean, default=True)
    show_total = Column(Boolean, default=True)
    show_paid_amount = Column(Boolean, default=True)
    show_balance_due = Column(Boolean, default=True)
    
    # Custom CSS (for advanced users)
    custom_css = Column(Text)
    
    # Template Status
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="invoice_templates")
    invoices = relationship("Invoice", back_populates="design_template")


class UserTemplateDefault(Base):
    __tablename__ = "user_template_defaults"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("invoice_templates.id"), nullable=False)
    is_default = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="template_defaults")
    template = relationship("InvoiceTemplate")
