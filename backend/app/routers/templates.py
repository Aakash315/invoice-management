from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.invoice_template import InvoiceTemplate, UserTemplateDefault
from app.models.user import User
from app.models.invoice import Invoice
from app.schemas.invoice_template import (
    InvoiceTemplateCreate, 
    InvoiceTemplateUpdate, 
    InvoiceTemplateResponse,
    UserTemplateDefaultCreate,
    UserTemplateDefaultResponse
)
from app.utils.dependencies import get_current_user
import json

router = APIRouter(prefix="/templates", tags=["Invoice Templates"])

@router.get("", response_model=List[InvoiceTemplateResponse])
async def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all invoice templates for the current user"""
    templates = db.query(InvoiceTemplate).filter(
        InvoiceTemplate.user_id == current_user.id
    ).order_by(InvoiceTemplate.created_at.desc()).all()
    
    return templates

@router.get("/{template_id}", response_model=InvoiceTemplateResponse)
async def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific invoice template"""
    template = db.query(InvoiceTemplate).filter(
        InvoiceTemplate.id == template_id,
        InvoiceTemplate.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return template

@router.post("", response_model=InvoiceTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: InvoiceTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new invoice template"""
    
    # If this is being set as default, unset other defaults
    if template_data.is_default:
        db.query(UserTemplateDefault).filter(
            UserTemplateDefault.user_id == current_user.id
        ).update({"is_default": False})
    
    # Create template
    template = InvoiceTemplate(
        user_id=current_user.id,
        **template_data.dict()
    )
    
    db.add(template)
    db.flush()  # Get template.id
    
    # Create default mapping if specified
    if template_data.is_default:
        default_mapping = UserTemplateDefault(
            user_id=current_user.id,
            template_id=template.id,
            is_default=True
        )
        db.add(default_mapping)
    
    db.commit()
    db.refresh(template)
    
    return template

@router.put("/{template_id}", response_model=InvoiceTemplateResponse)
async def update_template(
    template_id: int,
    template_data: InvoiceTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing invoice template"""
    template = db.query(InvoiceTemplate).filter(
        InvoiceTemplate.id == template_id,
        InvoiceTemplate.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Update template fields
    update_data = template_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    # Handle default setting
    if "is_default" in update_data and update_data["is_default"]:
        # Unset other defaults
        db.query(UserTemplateDefault).filter(
            UserTemplateDefault.user_id == current_user.id
        ).update({"is_default": False})
        
        # Update or create default mapping
        default_mapping = db.query(UserTemplateDefault).filter(
            UserTemplateDefault.user_id == current_user.id,
            UserTemplateDefault.template_id == template.id
        ).first()
        
        if default_mapping:
            default_mapping.is_default = True
        else:
            default_mapping = UserTemplateDefault(
                user_id=current_user.id,
                template_id=template.id,
                is_default=True
            )
            db.add(default_mapping)
    elif "is_default" in update_data and not update_data["is_default"]:
        # Remove default mapping if exists
        db.query(UserTemplateDefault).filter(
            UserTemplateDefault.user_id == current_user.id,
            UserTemplateDefault.template_id == template.id
        ).delete()
    
    db.commit()
    db.refresh(template)
    
    return template

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an invoice template"""
    template = db.query(InvoiceTemplate).filter(
        InvoiceTemplate.id == template_id,
        InvoiceTemplate.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Check if template is being used by any invoices
    invoices_count = db.query(Invoice).filter(Invoice.template_id == template_id).count()
    if invoices_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete template. It is being used by {invoices_count} invoice(s)"
        )
    
    # Remove default mapping if exists
    db.query(UserTemplateDefault).filter(
        UserTemplateDefault.user_id == current_user.id,
        UserTemplateDefault.template_id == template.id
    ).delete()
    
    # Delete template
    db.delete(template)
    db.commit()
    
    return None

@router.post("/{template_id}/duplicate", response_model=InvoiceTemplateResponse)
async def duplicate_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Duplicate an existing invoice template"""
    original_template = db.query(InvoiceTemplate).filter(
        InvoiceTemplate.id == template_id,
        InvoiceTemplate.user_id == current_user.id
    ).first()
    
    if not original_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Create duplicate
    duplicate_data = original_template.__dict__.copy()
    del duplicate_data['id']
    del duplicate_data['created_at']
    del duplicate_data['updated_at']
    
    duplicate_data['name'] = f"{original_template.name} (Copy)"
    duplicate_data['is_default'] = False  # Never duplicate as default
    
    template = InvoiceTemplate(
        user_id=current_user.id,
        **duplicate_data
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template

@router.get("/default/current", response_model=Optional[InvoiceTemplateResponse])
async def get_default_template(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current user's default template"""
    default_mapping = db.query(UserTemplateDefault).filter(
        UserTemplateDefault.user_id == current_user.id,
        UserTemplateDefault.is_default == True
    ).first()
    
    if not default_mapping:
        return None
    
    return db.query(InvoiceTemplate).filter(
        InvoiceTemplate.id == default_mapping.template_id
    ).first()

@router.post("/default", response_model=UserTemplateDefaultResponse)
async def set_default_template(
    default_data: UserTemplateDefaultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set a template as default for the current user"""
    
    # Verify template belongs to user
    template = db.query(InvoiceTemplate).filter(
        InvoiceTemplate.id == default_data.template_id,
        InvoiceTemplate.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Unset other defaults
    db.query(UserTemplateDefault).filter(
        UserTemplateDefault.user_id == current_user.id
    ).update({"is_default": False})
    
    # Update or create default mapping
    default_mapping = db.query(UserTemplateDefault).filter(
        UserTemplateDefault.user_id == current_user.id,
        UserTemplateDefault.template_id == default_data.template_id
    ).first()
    
    if default_mapping:
        default_mapping.is_default = default_data.is_default
    else:
        default_mapping = UserTemplateDefault(
            user_id=current_user.id,
            template_id=default_data.template_id,
            is_default=default_data.is_default
        )
        db.add(default_mapping)
    
    db.commit()
    db.refresh(default_mapping)
    
    return default_mapping

@router.get("/predefined/list")
async def get_predefined_templates():
    """Get list of predefined template types with their configurations"""
    predefined_templates = {
        "modern": {
            "name": "Modern Template",
            "description": "Clean, minimalist design with bold colors and modern fonts",
            "preview_image": "/previews/modern.png",
            "default_config": {
                "template_type": "modern",
                "color_primary": "#2563eb",
                "color_secondary": "#6b7280",
                "color_accent": "#10b981",
                "color_text": "#111827",
                "color_background": "#ffffff",
                "font_family": "helvetica",
                "font_size_base": 10,
                "font_size_header": 16,
                "font_size_title": 24,
                "header_style": "modern",
                "item_table_style": "modern",
                "totals_layout": "right",
                "layout_columns": "single"
            }
        },
        "classic": {
            "name": "Classic Template", 
            "description": "Traditional business invoice with conservative colors and serif fonts",
            "preview_image": "/previews/classic.png",
            "default_config": {
                "template_type": "classic",
                "color_primary": "#374151",
                "color_secondary": "#6b7280",
                "color_accent": "#059669",
                "color_text": "#1f2937",
                "color_background": "#ffffff",
                "font_family": "times",
                "font_size_base": 12,
                "font_size_header": 14,
                "font_size_title": 20,
                "header_style": "classic",
                "item_table_style": "classic",
                "totals_layout": "right",
                "layout_columns": "single"
            }
        },
        "minimal": {
            "name": "Minimal Template",
            "description": "Ultra-clean design with lots of white space and subtle colors",
            "preview_image": "/previews/minimal.png",
            "default_config": {
                "template_type": "minimal",
                "color_primary": "#6366f1",
                "color_secondary": "#a1a1aa",
                "color_accent": "#8b5cf6",
                "color_text": "#27272a",
                "color_background": "#fafafa",
                "font_family": "helvetica",
                "font_size_base": 9,
                "font_size_header": 15,
                "font_size_title": 22,
                "header_style": "minimal",
                "item_table_style": "minimal",
                "totals_layout": "right",
                "layout_columns": "single"
            }
        },
        "corporate": {
            "name": "Corporate Template",
            "description": "Professional, trust-inspiring design with structured layout",
            "preview_image": "/previews/corporate.png",
            "default_config": {
                "template_type": "corporate",
                "color_primary": "#1e40af",
                "color_secondary": "#475569",
                "color_accent": "#0ea5e9",
                "color_text": "#0f172a",
                "color_background": "#ffffff",
                "font_family": "helvetica",
                "font_size_base": 11,
                "font_size_header": 17,
                "font_size_title": 26,
                "header_style": "corporate",
                "item_table_style": "corporate",
                "totals_layout": "right",
                "layout_columns": "two"
            }
        }
    }
    
    return predefined_templates

@router.post("/predefined/create/{template_type}")
async def create_template_from_predefined(
    template_type: str,
    template_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new template from a predefined type"""
    predefined_templates = {
        "modern": {
            "name": template_name or "Modern Template",
            "description": "Clean, minimalist design with bold colors and modern fonts",
            "template_type": "modern",
            "color_primary": "#2563eb",
            "color_secondary": "#6b7280", 
            "color_accent": "#10b981",
            "color_text": "#111827",
            "color_background": "#ffffff",
            "font_family": "helvetica",
            "font_size_base": 10,
            "font_size_header": 16,
            "font_size_title": 24,
            "header_style": "modern",
            "item_table_style": "modern",
            "totals_layout": "right",
            "layout_columns": "single"
        },
        "classic": {
            "name": template_name or "Classic Template",
            "description": "Traditional business invoice with conservative colors and serif fonts", 
            "template_type": "classic",
            "color_primary": "#374151",
            "color_secondary": "#6b7280",
            "color_accent": "#059669",
            "color_text": "#1f2937",
            "color_background": "#ffffff",
            "font_family": "times",
            "font_size_base": 12,
            "font_size_header": 14,
            "font_size_title": 20,
            "header_style": "classic",
            "item_table_style": "classic",
            "totals_layout": "right",
            "layout_columns": "single"
        },
        "minimal": {
            "name": template_name or "Minimal Template",
            "description": "Ultra-clean design with lots of white space and subtle colors",
            "template_type": "minimal", 
            "color_primary": "#6366f1",
            "color_secondary": "#a1a1aa",
            "color_accent": "#8b5cf6",
            "color_text": "#27272a",
            "color_background": "#fafafa",
            "font_family": "helvetica",
            "font_size_base": 9,
            "font_size_header": 15,
            "font_size_title": 22,
            "header_style": "minimal",
            "item_table_style": "minimal",
            "totals_layout": "right",
            "layout_columns": "single"
        },
        "corporate": {
            "name": template_name or "Corporate Template",
            "description": "Professional, trust-inspiring design with structured layout",
            "template_type": "corporate",
            "color_primary": "#1e40af",
            "color_secondary": "#475569", 
            "color_accent": "#0ea5e9",
            "color_text": "#0f172a",
            "color_background": "#ffffff",
            "font_family": "helvetica",
            "font_size_base": 11,
            "font_size_header": 17,
            "font_size_title": 26,
            "header_style": "corporate",
            "item_table_style": "corporate",
            "totals_layout": "right",
            "layout_columns": "two"
        }
    }
    
    if template_type not in predefined_templates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid template type: {template_type}. Available types: {list(predefined_templates.keys())}"
        )
    
    template_config = predefined_templates[template_type]
    
    # Create template
    template = InvoiceTemplate(
        user_id=current_user.id,
        **template_config
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return template
