from fastapi import APIRouter, Depends, HTTPException, status, Query, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.invoice import Invoice, InvoiceItem
from app.models.email_history import EmailHistory, EmailStatus
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.schemas.email_history import EmailHistoryResponse
from app.utils.dependencies import get_current_user
from app.utils.mail import send_email
from app.utils.exchange_rates import ExchangeRateManager
import tempfile
import os
import json
import uuid
from datetime import datetime

router = APIRouter(prefix="/invoices", tags=["Invoices"])

# Tracking endpoints for email delivery confirmation
@router.get("/track/open/{tracking_id}", status_code=status.HTTP_200_OK)
async def track_email_open(
    tracking_id: str,
    db: Session = Depends(get_db)
):
    """Track email open events"""
    email_history = db.query(EmailHistory).filter(EmailHistory.tracking_id == tracking_id).first()
    if email_history:
        # Update email status to opened
        email_history.status = EmailStatus.OPENED
        email_history.opened_at = datetime.now()
        db.commit()
    
    # Return 1x1 transparent GIF
    from fastapi.responses import StreamingResponse
    import io
    
    # 1x1 transparent GIF
    gif_bytes = io.BytesIO(b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;')
    
    return StreamingResponse(
        gif_bytes,
        media_type='image/gif',
        headers={
            'Content-Length': str(len(gif_bytes.getvalue())),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    )

@router.post("/track/delivery/{tracking_id}")
async def track_email_delivery(
    tracking_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    """Track email delivery status updates"""
    email_history = db.query(EmailHistory).filter(EmailHistory.tracking_id == tracking_id).first()
    if not email_history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Update status based on delivery webhook
    if status == "delivered":
        email_history.status = EmailStatus.DELIVERED
        email_history.delivered_at = datetime.now()
    elif status == "bounced":
        email_history.status = EmailStatus.BOUNCED
        email_history.bounced_at = datetime.now()
    
    db.commit()
    
    return {"message": "Delivery status updated"}

@router.get("/{invoice_id}/email-history", response_model=List[EmailHistoryResponse])
async def get_email_history(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Get email history and add computed fields for frontend
    email_history_list = invoice.email_history
    enhanced_history = []
    
    for history in email_history_list:
        # Create enhanced response with computed fields
        enhanced_history_item = EmailHistoryResponse(
            **history.__dict__,
            status_display=history.get_status_display(),
            status_color=history.get_status_color(),
            formatted_sent_time=history.get_formatted_sent_time(),
            delivery_summary=history.get_delivery_summary()
        )
        enhanced_history.append(enhanced_history_item)
    
    return enhanced_history

@router.get("", response_model=List[InvoiceResponse])
async def get_invoices(
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None),
    currency: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Invoice)
    
    if status:
        query = query.filter(Invoice.status == status)
    if payment_status:
        query = query.filter(Invoice.payment_status == payment_status)
    if client_id:
        query = query.filter(Invoice.client_id == client_id)
    if currency:
        query = query.filter(Invoice.currency == currency)
    
    invoices = query.order_by(Invoice.created_at.desc()).all()
    
    # Calculate balance for each invoice
    for invoice in invoices:
        invoice.balance = invoice.total_amount - invoice.paid_amount
    
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    invoice.balance = invoice.total_amount - invoice.paid_amount
    return invoice

@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Generate invoice number
    last_invoice = db.query(Invoice).order_by(Invoice.id.desc()).first()
    invoice_number = f"INV-{(last_invoice.id + 1 if last_invoice else 1):05d}"
    
    # Calculate totals
    subtotal = sum(item.quantity * item.rate for item in invoice_data.items)
    tax_amount = (subtotal * invoice_data.tax_rate) / 100
    total_amount = subtotal + tax_amount - invoice_data.discount

    # Handle currency conversion
    base_currency = current_user.base_currency or "INR"
    exchange_rate = 1.0
    base_currency_amount = total_amount

    if invoice_data.currency != base_currency:
        if invoice_data.exchange_rate:
            exchange_rate = invoice_data.exchange_rate
        else:
            rate_manager = ExchangeRateManager(db)
            exchange_rate = await rate_manager.get_exchange_rate(invoice_data.currency, base_currency)
        base_currency_amount = total_amount * exchange_rate
    
    # Create invoice
    invoice = Invoice(
        invoice_number=invoice_number,
        client_id=invoice_data.client_id,
        issue_date=invoice_data.issue_date,
        due_date=invoice_data.due_date,
        subtotal=subtotal,
        tax_rate=invoice_data.tax_rate,
        tax_amount=tax_amount,
        discount=invoice_data.discount,
        total_amount=total_amount,
        currency=invoice_data.currency,
        base_currency_amount=base_currency_amount,
        exchange_rate=exchange_rate,
        status=invoice_data.status,
        notes=invoice_data.notes,
        terms=invoice_data.terms,
        design_template_id=invoice_data.design_template_id,
        created_by=current_user.id
    )
    
    db.add(invoice)
    db.flush()  # Get invoice.id
    
    # Create invoice items
    for item_data in invoice_data.items:
        item = InvoiceItem(
            invoice_id=invoice.id,
            description=item_data.description,
            quantity=item_data.quantity,
            rate=item_data.rate,
            amount=item_data.quantity * item_data.rate
        )
        db.add(item)
    
    db.commit()
    db.refresh(invoice)
    
    invoice.balance = invoice.total_amount - invoice.paid_amount
    return invoice

@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Update invoice fields if provided
    if invoice_data.client_id is not None:
        invoice.client_id = invoice_data.client_id
    if invoice_data.issue_date is not None:
        invoice.issue_date = invoice_data.issue_date
    if invoice_data.due_date is not None:
        invoice.due_date = invoice_data.due_date
    if invoice_data.status is not None:
        invoice.status = invoice_data.status
    if invoice_data.notes is not None:
        invoice.notes = invoice_data.notes
    if invoice_data.terms is not None:
        invoice.terms = invoice_data.terms
    if invoice_data.tax_rate is not None:
        invoice.tax_rate = invoice_data.tax_rate
    if invoice_data.discount is not None:
        invoice.discount = invoice_data.discount
    if invoice_data.currency is not None:
        invoice.currency = invoice_data.currency
    if invoice_data.design_template_id is not None:
        invoice.design_template_id = invoice_data.design_template_id

    # Update items if provided
    if invoice_data.items is not None:
        # Delete existing items
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id).delete()
        
        # Recalculate totals based on current items and settings
        subtotal = sum(item.quantity * item.rate for item in invoice_data.items)
        tax_amount = (subtotal * invoice.tax_rate) / 100
        total_amount = subtotal + tax_amount - invoice.discount
        
        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total_amount = total_amount
        
        # Create new items
        for item_data in invoice_data.items:
            item = InvoiceItem(
                invoice_id=invoice.id,
                description=item_data.description,
                quantity=item_data.quantity,
                rate=item_data.rate,
                amount=item_data.quantity * item_data.rate
            )
            db.add(item)
    else:
        # If items not provided, recalculate totals based on existing items and current tax/discount
        existing_items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id).all()
        if existing_items:
            subtotal = sum(item.quantity * item.rate for item in existing_items)
            tax_amount = (subtotal * invoice.tax_rate) / 100
            total_amount = subtotal + tax_amount - invoice.discount
            
            invoice.subtotal = subtotal
            invoice.tax_amount = tax_amount
            invoice.total_amount = total_amount
    
    # Handle currency conversion
    base_currency = current_user.base_currency or "INR"
    exchange_rate = 1.0
    base_currency_amount = invoice.total_amount

    if invoice.currency != base_currency:
        if invoice_data.exchange_rate:
            exchange_rate = invoice_data.exchange_rate
        else:
            rate_manager = ExchangeRateManager(db)
            exchange_rate = await rate_manager.get_exchange_rate(invoice.currency, base_currency)
        base_currency_amount = invoice.total_amount * exchange_rate

    invoice.base_currency_amount = base_currency_amount
    invoice.exchange_rate = exchange_rate

    db.commit()
    db.refresh(invoice)
    
    invoice.balance = invoice.total_amount - invoice.paid_amount
    return invoice

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    db.delete(invoice)
    db.commit()
    
    return None

@router.post("/{invoice_id}/send-email", status_code=status.HTTP_200_OK)
async def send_invoice_email(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    to: str = Form(...),
    subject: str = Form(...),
    message: str = Form(...),
    cc: Optional[str] = Form(None),
    bcc: Optional[str] = Form(None),
    attachment: Optional[UploadFile] = File(None)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Load client data if exists
    client_name = "Client"
    if invoice.client:
        client_name = invoice.client.name
    
    recipients = [to]
    cc_list = []
    bcc_list = []
    
    if cc:
        cc_list = cc.split(',')
        recipients.extend(cc_list)
    if bcc:
        bcc_list = bcc.split(',')
        recipients.extend(bcc_list)

    # Prepare attachment
    attachment_path = None

    # Prepare invoice data for email template
    invoice_data = {
        'company_name': 'Webby Wonder',
        'company_location': 'Mumbai, India',
        'client_name': client_name,
        'invoice_number': invoice.invoice_number,
        'total_amount': f"{invoice.total_amount:,.2f}",
        'due_date': invoice.due_date.strftime('%d/%m/%Y') if invoice.due_date else 'N/A'
    }

    email_history = None
    # Generate unique tracking ID
    tracking_id = str(uuid.uuid4())
    
    try:
        await send_email(
            subject=subject,
            recipients=recipients,
            invoice_data=invoice_data,
            attachment=attachment,
            tracking_id=tracking_id
        )

        # Create email history record
        email_history = EmailHistory(
            invoice_id=invoice_id,
            sent_to=to,  # Primary recipient
            recipient=to,
            subject=subject,
            cc=json.dumps(cc_list) if cc_list else None,
            bcc=json.dumps(bcc_list) if bcc_list else None,
            body_preview=message[:500],  # First 500 characters
            attachment_filename=attachment.filename if attachment else None,
            status=EmailStatus.SENT,
            tracking_id=tracking_id,
            sent_at=datetime.now()
        )
        db.add(email_history)

        if invoice.status == "draft":
            invoice.status = "sent"

        db.commit()
        db.refresh(email_history)

        return {"message": f"Invoice {invoice.invoice_number} sent to {to} successfully!"}
    except Exception as e:
        print(f"Email sending error: {e}")
        
        # Create failed email history record
        email_history = EmailHistory(
            invoice_id=invoice_id,
            sent_to=to,  # Primary recipient
            recipient=to,
            subject=subject,
            cc=json.dumps(cc_list) if cc_list else None,
            bcc=json.dumps(bcc_list) if bcc_list else None,
            body_preview=message[:500],
            attachment_filename=attachment.filename if attachment else None,
            status=EmailStatus.FAILED,
            tracking_id=tracking_id,
            error_message=str(e),
            sent_at=datetime.now()
        )
        db.add(email_history)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )
    finally:
        # Clean up the temporary file
        if attachment_path and os.path.exists(attachment_path):
            os.remove(attachment_path)
