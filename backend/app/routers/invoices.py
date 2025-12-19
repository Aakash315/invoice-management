from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.invoice import Invoice, InvoiceItem
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("", response_model=List[InvoiceResponse])
async def get_invoices(
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    client_id: Optional[int] = Query(None),
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
        status=invoice_data.status,
        notes=invoice_data.notes,
        terms=invoice_data.terms,
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