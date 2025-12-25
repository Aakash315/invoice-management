from fastapi import APIRouter, Request, HTTPException, status, Depends
from sqlalchemy.orm import Session
import hmac
import hashlib
import json
from app.config import settings
from app.database import get_db
from app.models.invoice import Invoice
from app.models.payment import Payment
from datetime import date # Import date for payment_date

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay webhook secret is not configured."
        )

    body = await request.body()
    signature = request.headers.get('X-Razorpay-Signature')

    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook signature missing."
        )

    # Verify signature
    expected_signature = hmac.new(
        key=bytes(settings.RAZORPAY_WEBHOOK_SECRET, 'utf-8'),
        msg=body,
        digestmod=hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature."
        )

    event = json.loads(body.decode('utf-8'))
    
    # Process specific event types
    if event['event'] == 'payment.captured':
        payment_entity = event['payload']['payment']['entity']
        order_entity = event['payload']['order']['entity']

        razorpay_payment_id = payment_entity['id']
        razorpay_order_id = order_entity['id']
        amount_paid_in_paisa = payment_entity['amount'] # Amount in smallest unit
        currency = payment_entity['currency']
        
        # Convert amount back to major unit
        amount_paid = amount_paid_in_paisa / 100

        # Retrieve invoice_id from order notes
        invoice_id = int(order_entity['notes']['invoice_id'])
        client_id = int(order_entity['notes']['client_id']) # Not strictly needed here, but good for logs

        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            print(f"Webhook error: Invoice with ID {invoice_id} not found.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found."
            )
        
        # Check if payment already exists to prevent duplicates
        existing_payment = db.query(Payment).filter(
            Payment.gateway_payment_id == razorpay_payment_id,
            Payment.gateway_name == "razorpay"
        ).first()

        if existing_payment:
            print(f"Webhook: Duplicate payment received for Razorpay Payment ID {razorpay_payment_id}.")
            return {"status": "success", "message": "Payment already processed."}

        # Create new payment record
        payment = Payment(
            invoice_id=invoice.id,
            payment_date=date.today(), # Use current date for payment date
            amount=amount_paid,
            payment_method="Online - Razorpay",
            reference_number=razorpay_order_id,
            gateway_payment_id=razorpay_payment_id,
            gateway_name="razorpay"
        )
        db.add(payment)

        # Update invoice status
        invoice.paid_amount += amount_paid
        if invoice.paid_amount >= invoice.total_amount:
            invoice.payment_status = "paid"
            invoice.status = "paid"
        elif invoice.paid_amount > 0:
            invoice.payment_status = "partial"
        
        db.commit()
        db.refresh(payment)
        db.refresh(invoice)

        print(f"Razorpay payment {razorpay_payment_id} captured for invoice {invoice.invoice_number}.")
        return {"status": "success", "message": "Payment processed successfully."}
    
    else:
        print(f"Unhandled Razorpay event: {event['event']}")
        return {"status": "ignored", "message": "Unhandled event type."}
