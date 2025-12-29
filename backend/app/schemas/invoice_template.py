from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from app.schemas.client import ClientResponse

class InvoiceTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    template_type: str
    
    # Company Branding
    company_logo_url: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    
    # Color Scheme
    color_primary: Optional[str] = "#2563eb"
    color_secondary: Optional[str] = "#6b7280"
    color_accent: Optional[str] = "#10b981"
    color_text: Optional[str] = "#111827"
    color_background: Optional[str] = "#ffffff"
    
    # Typography
    font_family: Optional[str] = "helvetica"
    font_size_base: Optional[int] = 10
    font_size_header: Optional[int] = 16
    font_size_title: Optional[int] = 24
    
    # Layout Settings
    header_style: Optional[str] = "modern"
    item_table_style: Optional[str] = "modern"
    totals_layout: Optional[str] = "right"
    layout_columns: Optional[str] = "single"
    
    # Field Visibility Settings
    show_invoice_number: Optional[bool] = True
    show_issue_date: Optional[bool] = True
    show_due_date: Optional[bool] = True
    show_notes: Optional[bool] = True
    show_terms: Optional[bool] = True
    show_payment_instructions: Optional[bool] = True
    show_company_logo: Optional[bool] = True
    show_company_details: Optional[bool] = True
    show_client_details: Optional[bool] = True
    show_line_items: Optional[bool] = True
    show_subtotal: Optional[bool] = True
    show_tax: Optional[bool] = True
    show_discount: Optional[bool] = True
    show_total: Optional[bool] = True
    show_paid_amount: Optional[bool] = True
    show_balance_due: Optional[bool] = True
    
    # Custom CSS
    custom_css: Optional[str] = None
    
    # Template Status
    is_default: Optional[bool] = False
    is_active: Optional[bool] = True

class InvoiceTemplateCreate(InvoiceTemplateBase):
    pass

class InvoiceTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    template_type: Optional[str] = None
    
    # Company Branding
    company_logo_url: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    
    # Color Scheme
    color_primary: Optional[str] = None
    color_secondary: Optional[str] = None
    color_accent: Optional[str] = None
    color_text: Optional[str] = None
    color_background: Optional[str] = None
    
    # Typography
    font_family: Optional[str] = None
    font_size_base: Optional[int] = None
    font_size_header: Optional[int] = None
    font_size_title: Optional[int] = None
    
    # Layout Settings
    header_style: Optional[str] = None
    item_table_style: Optional[str] = None
    totals_layout: Optional[str] = None
    layout_columns: Optional[str] = None
    
    # Field Visibility Settings
    show_invoice_number: Optional[bool] = None
    show_issue_date: Optional[bool] = None
    show_due_date: Optional[bool] = None
    show_notes: Optional[bool] = None
    show_terms: Optional[bool] = None
    show_payment_instructions: Optional[bool] = None
    show_company_logo: Optional[bool] = None
    show_company_details: Optional[bool] = None
    show_client_details: Optional[bool] = None
    show_line_items: Optional[bool] = None
    show_subtotal: Optional[bool] = None
    show_tax: Optional[bool] = None
    show_discount: Optional[bool] = None
    show_total: Optional[bool] = None
    show_paid_amount: Optional[bool] = None
    show_balance_due: Optional[bool] = None
    
    # Custom CSS
    custom_css: Optional[str] = None
    
    # Template Status
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None

class InvoiceTemplateResponse(InvoiceTemplateBase):
    id: int
    user_id: int
    
    # Metadata
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes = True
    )

class InvoiceTemplatePreview(BaseModel):
    """Preview data for template"""
    template_config: dict
    preview_image_url: Optional[str] = None
    sample_invoice_data: Optional[dict] = None

class UserTemplateDefaultBase(BaseModel):
    template_id: int
    is_default: Optional[bool] = False

class UserTemplateDefaultCreate(UserTemplateDefaultBase):
    pass

class UserTemplateDefaultResponse(UserTemplateDefaultBase):
    id: int
    user_id: int
    created_at: datetime
    
    # Include template info
    template: Optional[InvoiceTemplateResponse] = None
    
    model_config = ConfigDict(
        from_attributes = True
    )
