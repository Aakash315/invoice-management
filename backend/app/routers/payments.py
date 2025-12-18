from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payment import Payment
from app.models.invoice import Invoice
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/invoice/{invoice_id}", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def add_payment(
    invoice_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Create payment
    payment = Payment(
        invoice_id=invoice_id,
        amount=payment_data.amount,
        payment_date=payment_data.payment_date,
        payment_method=payment_data.payment_method,
        reference_number=payment_data.reference_number,
        notes=payment_data.notes
    )
    
    db.add(payment)
    
    # Update invoice payment status
    invoice.paid_amount += payment_data.amount
    
    if invoice.paid_amount >= invoice.total_amount:
        invoice.payment_status = "paid"
        invoice.status = "paid"
    elif invoice.paid_amount > 0:
        invoice.payment_status = "partial"
    
    db.commit()
    db.refresh(payment)
    
    return payment

@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Update invoice
    invoice = payment.invoice
    invoice.paid_amount -= payment.amount
    
    if invoice.paid_amount <= 0:
        invoice.payment_status = "unpaid"
    elif invoice.paid_amount < invoice.total_amount:
        invoice.payment_status = "partial"
    
    db.delete(payment)
    db.commit()
    
    return None