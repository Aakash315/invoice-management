from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.invoice import Invoice, InvoiceItem
from app.models.recurring_invoice import RecurringInvoice, RecurringInvoiceTemplateItem
from app.models.user import User
from app.models.client import Client
from app.models.email_history import EmailHistory, EmailStatus
from app.schemas.recurring_invoice import (
    RecurringInvoiceCreate, RecurringInvoiceUpdate, RecurringInvoiceResponse,
    RecurringInvoiceListResponse, RecurringInvoiceHistoryItem, RecurringInvoicePreview,
    RecurringInvoiceStats, RecurringInvoiceTemplateItemCreate
)
from app.utils.dependencies import get_current_user
from app.utils.recurring_invoice_utils import (
    calculate_next_date, calculate_next_dates, validate_recurrence_config,
    format_frequency_display
)
from app.utils.mail import send_email
from datetime import datetime, date, timedelta
import logging
import uuid
import json

router = APIRouter(prefix="/recurring-invoices", tags=["Recurring Invoices"])
logger = logging.getLogger(__name__)

def create_invoice_from_template(template: RecurringInvoice, generation_date: date, db: Session) -> Invoice:
    """
    Create a new invoice from a recurring invoice template.
    
    Args:
        template: The recurring invoice template
        generation_date: The date for the new invoice
        db: Database session
    
    Returns:
        Created invoice instance
    """
    # Generate invoice number
    last_invoice = db.query(Invoice).order_by(Invoice.id.desc()).first()
    invoice_number = f"INV-{(last_invoice.id + 1 if last_invoice else 1):05d}"
    
    # Calculate totals from template items
    subtotal = sum(item.amount for item in template.template_items)
    tax_rate = 18.0  # Default tax rate
    tax_amount = (subtotal * tax_rate) / 100
    total_amount = subtotal + tax_amount  # No discount for recurring invoices by default
    
    # Create invoice
    invoice = Invoice(
        invoice_number=invoice_number,
        client_id=template.client_id,
        issue_date=generation_date,
        due_date=generation_date + timedelta(days=30),  # 30 days due date
        subtotal=subtotal,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        discount=0.0,  # No discount by default
        total_amount=total_amount,
        status="draft",
        notes=f"Generated from recurring template: {template.template_name}",
        terms="Payment due within 30 days.",
        created_by=template.created_by,
        template_id=template.id,
        generated_by_template=True
    )
    
    db.add(invoice)
    db.flush()  # Get invoice.id
    
    # Create invoice items from template items
    for template_item in template.template_items:
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            description=template_item.description,
            quantity=template_item.quantity,
            rate=template_item.rate,
            amount=template_item.amount
        )
        db.add(invoice_item)
    
    # Update template statistics
    template.current_occurrence += 1
    template.generation_count += 1
    template.last_generated_at = datetime.utcnow()
    
    # Calculate next due date
    template.next_due_date = calculate_next_date(
        generation_date,
        template.frequency,
        template.interval_value,
        template.day_of_week,
        template.day_of_month
    )
    
    # Check if we should deactivate the template
    if template.occurrences_limit and template.current_occurrence >= template.occurrences_limit:
        template.is_active = False
    
    if template.end_date and template.next_due_date > template.end_date:
        template.is_active = False
    
    return invoice

async def send_recurring_invoice_email(invoice: Invoice, template: RecurringInvoice, db: Session):
    """
    Send email for a generated recurring invoice if auto-send is enabled.
    
    Args:
        invoice: The generated invoice
        template: The template that generated it
        db: Database session
    """
    if not template.auto_send or not template.email_subject:
        return
    
    try:
        # Get client email
        client_email = invoice.client.email if invoice.client else None
        if not client_email:
            logger.warning(f"No email found for client {invoice.client_id}")
            return
        
        # Prepare invoice data for email
        invoice_data = {
            'company_name': 'Webby Wonder',
            'company_location': 'Mumbai, India',
            'client_name': invoice.client.name if invoice.client else 'Client',
            'invoice_number': invoice.invoice_number,
            'total_amount': f"{invoice.total_amount:,.2f}",
            'due_date': invoice.due_date.strftime('%d/%m/%Y') if invoice.due_date else 'N/A'
        }
        
        # Generate tracking ID
        tracking_id = str(uuid.uuid4())
        
        # Send email
        await send_email(
            subject=template.email_subject,
            recipients=[client_email],
            invoice_data=invoice_data,
            attachment=None,  # No attachment for auto-send
            tracking_id=tracking_id
        )
        
        # Create email history record
        email_history = EmailHistory(
            invoice_id=invoice.id,
            sent_to=client_email,
            recipient=client_email,
            subject=template.email_subject,
            cc=None,
            bcc=None,
            body_preview=template.email_message[:500] if template.email_message else None,
            attachment_filename=None,
            status=EmailStatus.SENT,
            tracking_id=tracking_id,
            sent_at=datetime.utcnow()
        )
        db.add(email_history)
        
        logger.info(f"Auto-sent recurring invoice {invoice.invoice_number} to {client_email}")
        
    except Exception as e:
        logger.error(f"Failed to auto-send recurring invoice {invoice.invoice_number}: {str(e)}")
        # Increment failed generations counter
        template.failed_generations += 1

@router.post("/generate", status_code=status.HTTP_200_OK)
async def generate_due_recurring_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually trigger generation of due recurring invoices.
    This endpoint can be called by a cron job or manually.
    """
    today = date.today()
    
    # Get all active templates due for generation
    templates = db.query(RecurringInvoice).filter(
        RecurringInvoice.created_by == current_user.id,
        RecurringInvoice.is_active == True,
        RecurringInvoice.next_due_date <= today
    ).all()
    
    generated_invoices = []
    failed_generations = []
    
    for template in templates:
        try:
            # Check constraints before generation
            if template.end_date and today > template.end_date:
                template.is_active = False
                continue
            
            if template.occurrences_limit and template.current_occurrence >= template.occurrences_limit:
                template.is_active = False
                continue
            
            # Generate invoice
            invoice = create_invoice_from_template(template, today, db)
            generated_invoices.append(invoice)
            
            # Send email if auto-send is enabled
            if template.auto_send:
                await send_recurring_invoice_email(invoice, template, db)
            
            logger.info(f"Generated recurring invoice {invoice.invoice_number} from template {template.template_name}")
            
        except Exception as e:
            logger.error(f"Failed to generate invoice from template {template.template_name}: {str(e)}")
            template.failed_generations += 1
            failed_generations.append({
                'template_id': template.id,
                'template_name': template.template_name,
                'error': str(e)
            })
    
    db.commit()
    
    return {
        'message': f'Generated {len(generated_invoices)} invoices, {len(failed_generations)} failures',
        'generated_invoices': len(generated_invoices),
        'failed_generations': len(failed_generations),
        'details': failed_generations
    }

@router.post("/{template_id}/generate", response_model=dict)
async def generate_single_recurring_invoice(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually generate a single invoice from a specific template.
    """
    template = db.query(RecurringInvoice).filter(
        RecurringInvoice.id == template_id,
        RecurringInvoice.created_by == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring invoice template not found"
        )
    
    if not template.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template is not active"
        )
    
    today = date.today()
    
    try:
        # Generate invoice
        invoice = create_invoice_from_template(template, today, db)
        
        # Send email if auto-send is enabled
        if template.auto_send:
            await send_recurring_invoice_email(invoice, template, db)
        
        db.commit()
        
        logger.info(f"Manually generated recurring invoice {invoice.invoice_number} from template {template.template_name}")
        
        return {
            'message': f'Invoice {invoice.invoice_number} generated successfully',
            'invoice_id': invoice.id,
            'invoice_number': invoice.invoice_number
        }
        
    except Exception as e:
        logger.error(f"Failed to generate invoice from template {template.template_name}: {str(e)}")
        template.failed_generations += 1
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate invoice: {str(e)}"
        )

@router.get("/stats", response_model=RecurringInvoiceStats)
async def get_recurring_invoice_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get statistics for recurring invoices."""
    user_id = current_user.id
    
    # Get basic counts
    total_templates = db.query(RecurringInvoice).filter(
        RecurringInvoice.created_by == user_id
    ).count()
    
    active_templates = db.query(RecurringInvoice).filter(
        RecurringInvoice.created_by == user_id,
        RecurringInvoice.is_active == True
    ).count()
    
    inactive_templates = total_templates - active_templates
    
    # Get generation statistics
    total_generated = db.query(RecurringInvoice).filter(
        RecurringInvoice.created_by == user_id
    ).with_entities(RecurringInvoice.generation_count).all()
    
    total_generated_count = sum(count[0] for count in total_generated)
    
    total_failed = db.query(RecurringInvoice).filter(
        RecurringInvoice.created_by == user_id
    ).with_entities(RecurringInvoice.failed_generations).all()
    
    total_failed_count = sum(count[0] for count in total_failed)
    
    templates_with_auto_send = db.query(RecurringInvoice).filter(
        RecurringInvoice.created_by == user_id,
        RecurringInvoice.auto_send == True
    ).count()
    
    return RecurringInvoiceStats(
        total_templates=total_templates,
        active_templates=active_templates,
        inactive_templates=inactive_templates,
        total_generated=total_generated_count,
        total_failed=total_failed_count,
        templates_with_auto_send=templates_with_auto_send
    )

@router.get("", response_model=List[RecurringInvoiceListResponse])
async def get_recurring_invoices(
    is_active: Optional[bool] = Query(None),
    client_id: Optional[int] = Query(None),
    frequency: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all recurring invoice templates for the current user."""
    query = db.query(RecurringInvoice).filter(
        RecurringInvoice.created_by == current_user.id
    )
    
    # Apply filters
    if is_active is not None:
        query = query.filter(RecurringInvoice.is_active == is_active)
    if client_id is not None:
        query = query.filter(RecurringInvoice.client_id == client_id)
    if frequency is not None:
        query = query.filter(RecurringInvoice.frequency == frequency)
    
    templates = query.order_by(RecurringInvoice.created_at.desc()).all()
    
    result = []
    for template in templates:
        template_dict = {
            'id': template.id,
            'template_name': template.template_name,
            'frequency': template.frequency,
            'interval_value': template.interval_value,
            'day_of_week': template.day_of_week,
            'day_of_month': template.day_of_month,
            'start_date': template.start_date,
            'end_date': template.end_date,
            'is_active': template.is_active,
            'auto_send': template.auto_send,
            'generation_count': template.generation_count,
            'failed_generations': template.failed_generations,
            'next_due_date': template.next_due_date,
            'created_at': template.created_at,
            'client': template.client
        }
        result.append(RecurringInvoiceListResponse(**template_dict))
    
    return result

@router.get("/{template_id}", response_model=RecurringInvoiceResponse)
async def get_recurring_invoice(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific recurring invoice template."""
    template = db.query(RecurringInvoice).filter(
        RecurringInvoice.id == template_id,
        RecurringInvoice.created_by == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring invoice template not found"
        )
    
    template_dict = {
        'id': template.id,
        'template_name': template.template_name,
        'client_id': template.client_id,
        'frequency': template.frequency,
        'interval_value': template.interval_value,
        'day_of_week': template.day_of_week,
        'day_of_month': template.day_of_month,
        'start_date': template.start_date,
        'end_date': template.end_date,
        'occurrences_limit': template.occurrences_limit,
        'current_occurrence': template.current_occurrence,
        'is_active': template.is_active,
        'auto_send': template.auto_send,
        'email_subject': template.email_subject,
        'email_message': template.email_message,
        'created_by': template.created_by,
        'created_at': template.created_at,
        'updated_at': template.updated_at,
        'last_generated_at': template.last_generated_at,
        'next_due_date': template.next_due_date,
        'generation_count': template.generation_count,
        'failed_generations': template.failed_generations,
        'client': template.client,
        'template_items': template.template_items
    }
    
    return RecurringInvoiceResponse(**template_dict)

@router.post("", response_model=RecurringInvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_recurring_invoice(
    template_data: RecurringInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new recurring invoice template."""
    
    # Validate recurrence configuration
    errors = validate_recurrence_config(
        template_data.frequency,
        template_data.interval_value,
        template_data.day_of_week,
        template_data.day_of_month,
        template_data.start_date,
        template_data.end_date
    )
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid recurrence configuration: " + "; ".join(errors)
        )
    
    # Check if client exists and belongs to user
    client = db.query(Client).filter(
        Client.id == template_data.client_id,
        Client.created_by == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found or access denied"
        )
    
    # Calculate first next due date
    next_due_date = calculate_next_date(
        template_data.start_date,
        template_data.frequency,
        template_data.interval_value,
        template_data.day_of_week,
        template_data.day_of_month
    )
    
    # Create the template
    template = RecurringInvoice(
        template_name=template_data.template_name,
        client_id=template_data.client_id,
        frequency=template_data.frequency,
        interval_value=template_data.interval_value,
        day_of_week=template_data.day_of_week,
        day_of_month=template_data.day_of_month,
        start_date=template_data.start_date,
        end_date=template_data.end_date,
        occurrences_limit=template_data.occurrences_limit,
        is_active=template_data.is_active,
        auto_send=template_data.auto_send,
        email_subject=template_data.email_subject,
        email_message=template_data.email_message,
        created_by=current_user.id,
        next_due_date=next_due_date
    )
    
    db.add(template)
    db.flush()  # Get template.id
    
    # Create template items
    for i, item_data in enumerate(template_data.items):
        item = RecurringInvoiceTemplateItem(
            recurring_invoice_id=template.id,
            description=item_data.description,
            quantity=item_data.quantity,
            rate=item_data.rate,
            amount=item_data.quantity * item_data.rate,
            sort_order=i
        )
        db.add(item)
    
    db.commit()
    db.refresh(template)
    
    template_dict = {
        'id': template.id,
        'template_name': template.template_name,
        'client_id': template.client_id,
        'frequency': template.frequency,
        'interval_value': template.interval_value,
        'day_of_week': template.day_of_week,
        'day_of_month': template.day_of_month,
        'start_date': template.start_date,
        'end_date': template.end_date,
        'occurrences_limit': template.occurrences_limit,
        'current_occurrence': template.current_occurrence,
        'is_active': template.is_active,
        'auto_send': template.auto_send,
        'email_subject': template.email_subject,
        'email_message': template.email_message,
        'created_by': template.created_by,
        'created_at': template.created_at,
        'updated_at': template.updated_at,
        'last_generated_at': template.last_generated_at,
        'next_due_date': template.next_due_date,
        'generation_count': template.generation_count,
        'failed_generations': template.failed_generations,
        'client': template.client,
        'template_items': template.template_items
    }
    
    return RecurringInvoiceResponse(**template_dict)

@router.put("/{template_id}", response_model=RecurringInvoiceResponse)
async def update_recurring_invoice(
    template_id: int,
    template_data: RecurringInvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a recurring invoice template."""
    
    template = db.query(RecurringInvoice).filter(
        RecurringInvoice.id == template_id,
        RecurringInvoice.created_by == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring invoice template not found"
        )
    
    # Update fields if provided
    if template_data.template_name is not None:
        template.template_name = template_data.template_name
    if template_data.client_id is not None:
        # Check if client exists and belongs to user
        client = db.query(Client).filter(
            Client.id == template_data.client_id,
            Client.created_by == current_user.id
        ).first()
        
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found or access denied"
            )
        template.client_id = template_data.client_id
    
    # Handle frequency-related updates
    frequency_changed = False
    if template_data.frequency is not None:
        template.frequency = template_data.frequency
        frequency_changed = True
    if template_data.interval_value is not None:
        template.interval_value = template_data.interval_value
    if template_data.day_of_week is not None:
        template.day_of_week = template_data.day_of_week
    if template_data.day_of_month is not None:
        template.day_of_month = template_data.day_of_month
    
    # Update date fields if provided
    if template_data.start_date is not None:
        template.start_date = template_data.start_date
    if template_data.end_date is not None:
        template.end_date = template_data.end_date
    if template_data.occurrences_limit is not None:
        template.occurrences_limit = template_data.occurrences_limit
    
    # Update control fields
    if template_data.is_active is not None:
        template.is_active = template_data.is_active
    if template_data.auto_send is not None:
        template.auto_send = template_data.auto_send
    if template_data.email_subject is not None:
        template.email_subject = template_data.email_subject
    if template_data.email_message is not None:
        template.email_message = template_data.email_message
    
    # Update items if provided
    if template_data.items is not None:
        # Delete existing items
        db.query(RecurringInvoiceTemplateItem).filter(
            RecurringInvoiceTemplateItem.recurring_invoice_id == template.id
        ).delete()
        
        # Create new items
        for i, item_data in enumerate(template_data.items):
            item = RecurringInvoiceTemplateItem(
                recurring_invoice_id=template.id,
                description=item_data.description,
                quantity=item_data.quantity,
                rate=item_data.rate,
                amount=item_data.quantity * item_data.rate,
                sort_order=i
            )
            db.add(item)
    
    # Recalculate next due date if frequency or date-related fields changed
    if frequency_changed or template_data.start_date is not None:
        errors = validate_recurrence_config(
            template.frequency,
            template.interval_value,
            template.day_of_week,
            template.day_of_month,
            template.start_date,
            template.end_date
        )
        
        if errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid recurrence configuration: " + "; ".join(errors)
            )
        
        template.next_due_date = calculate_next_date(
            template.start_date,
            template.frequency,
            template.interval_value,
            template.day_of_week,
            template.day_of_month
        )
    
    template.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(template)
    
    template_dict = {
        'id': template.id,
        'template_name': template.template_name,
        'client_id': template.client_id,
        'frequency': template.frequency,
        'interval_value': template.interval_value,
        'day_of_week': template.day_of_week,
        'day_of_month': template.day_of_month,
        'start_date': template.start_date,
        'end_date': template.end_date,
        'occurrences_limit': template.occurrences_limit,
        'current_occurrence': template.current_occurrence,
        'is_active': template.is_active,
        'auto_send': template.auto_send,
        'email_subject': template.email_subject,
        'email_message': template.email_message,
        'created_by': template.created_by,
        'created_at': template.created_at,
        'updated_at': template.updated_at,
        'last_generated_at': template.last_generated_at,
        'next_due_date': template.next_due_date,
        'generation_count': template.generation_count,
        'failed_generations': template.failed_generations,
        'client': template.client,
        'template_items': template.template_items
    }
    
    return RecurringInvoiceResponse(**template_dict)

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring_invoice(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a recurring invoice template."""
    
    template = db.query(RecurringInvoice).filter(
        RecurringInvoice.id == template_id,
        RecurringInvoice.created_by == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring invoice template not found"
        )
    
    db.delete(template)
    db.commit()
    
    return None

@router.post("/{template_id}/toggle", response_model=RecurringInvoiceResponse)
async def toggle_recurring_invoice_status(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle active/inactive status of a recurring invoice template."""
    
    template = db.query(RecurringInvoice).filter(
        RecurringInvoice.id == template_id,
        RecurringInvoice.created_by == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring invoice template not found"
        )
    
    template.is_active = not template.is_active
    template.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(template)
    
    template_dict = {
        'id': template.id,
        'template_name': template.template_name,
        'client_id': template.client_id,
        'frequency': template.frequency,
        'interval_value': template.interval_value,
        'day_of_week': template.day_of_week,
        'day_of_month': template.day_of_month,
        'start_date': template.start_date,
        'end_date': template.end_date,
        'occurrences_limit': template.occurrences_limit,
        'current_occurrence': template.current_occurrence,
        'is_active': template.is_active,
        'auto_send': template.auto_send,
        'email_subject': template.email_subject,
        'email_message': template.email_message,
        'created_by': template.created_by,
        'created_at': template.created_at,
        'updated_at': template.updated_at,
        'last_generated_at': template.last_generated_at,
        'next_due_date': template.next_due_date,
        'generation_count': template.generation_count,
        'failed_generations': template.failed_generations,
        'client': template.client,
        'template_items': template.template_items
    }
    
    return RecurringInvoiceResponse(**template_dict)

@router.get("/{template_id}/preview", response_model=RecurringInvoicePreview)
async def preview_upcoming_invoices(
    template_id: int,
    count: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview upcoming invoice dates for a template."""
    
    template = db.query(RecurringInvoice).filter(
        RecurringInvoice.id == template_id,
        RecurringInvoice.created_by == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring invoice template not found"
        )
    
    # Calculate next dates
    next_dates = calculate_next_dates(
        template.start_date,
        template.frequency,
        template.interval_value,
        template.day_of_week,
        template.day_of_month,
        count,
        template.end_date,
        template.occurrences_limit
    )
    
    return RecurringInvoicePreview(
        next_due_dates=next_dates,
        template_name=template.template_name,
        frequency=template.frequency,
        interval_value=template.interval_value,
        day_of_week=template.day_of_week,
        day_of_month=template.day_of_month
    )

@router.get("/{template_id}/history", response_model=List[RecurringInvoiceHistoryItem])
async def get_generated_invoices_history(
    template_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get history of invoices generated from this template."""
    
    template = db.query(RecurringInvoice).filter(
        RecurringInvoice.id == template_id,
        RecurringInvoice.created_by == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring invoice template not found"
        )
    
    # Get generated invoices
    invoices = db.query(Invoice).filter(
        Invoice.template_id == template_id
    ).order_by(Invoice.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for invoice in invoices:
        invoice_dict = {
            'id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'issue_date': invoice.issue_date,
            'due_date': invoice.due_date,
            'total_amount': invoice.total_amount,
            'status': invoice.status,
            'payment_status': invoice.payment_status,
            'generated_at': invoice.created_at,
            'client': invoice.client
        }
        result.append(RecurringInvoiceHistoryItem(**invoice_dict))
    
    return result
