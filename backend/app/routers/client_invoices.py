from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.invoice import Invoice
from app.models.client import Client
from app.models.payment import Payment
from app.schemas.invoice import InvoiceResponse
from app.schemas.payment import PaymentResponse
from app.schemas.client import ClientProfileUpdate, ClientResponse
from app.utils.dependencies import get_current_client
from app.utils.exchange_rates import ExchangeRateManager
from app.schemas.dashboard import ClientDashboardResponse
from pydantic import BaseModel
import uuid

import hmac
import hashlib
import json
import base64
import httpx
from app.config import settings
from app.models.invoice import Invoice
from app.schemas.payment import PayPalOrderCreate, PayPalOrderResponse, PayPalCaptureRequest
from datetime import date


router = APIRouter(prefix="/client-portal", tags=["Client Portal Invoices"])

class CashfreeOrderCreate(BaseModel):
    invoice_id: int
    amount: float

class CashfreeOrderResponse(BaseModel):
    payment_session_id: str

class CashfreeOrderVerifyResponse(BaseModel):
    status: str
    message: str
    payment_status: str = None

@router.get("/dashboard", response_model=ClientDashboardResponse)
def get_client_dashboard(
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client)
):
    """
    Retrieve aggregated dashboard data for the authenticated client.
    """
    invoices = db.query(Invoice).filter(Invoice.client_id == current_client.id).order_by(Invoice.issue_date.desc()).all()
    
    if not invoices:
        return ClientDashboardResponse(
            outstanding_amount=0.0,
            total_invoices=0,
            recent_invoices=[]
        )

    client_invoice_ids = [invoice.id for invoice in invoices]
    payments = db.query(Payment).filter(Payment.invoice_id.in_(client_invoice_ids)).all()
    
    rate_manager = ExchangeRateManager(db)
    target_currency = current_client.base_currency
    
    total_invoiced_converted = 0.0
    for invoice in invoices:
        rate = rate_manager.get_exchange_rate(invoice.currency, target_currency)
        total_invoiced_converted += invoice.total_amount * rate
        
    total_paid_converted = 0.0
    invoice_currency_map = {invoice.id: invoice.currency for invoice in invoices}
    for payment in payments:
        payment_currency = invoice_currency_map.get(payment.invoice_id)
        if payment_currency:
            rate = rate_manager.get_exchange_rate(payment_currency, target_currency)
            total_paid_converted += payment.amount * rate
            
    outstanding_amount = total_invoiced_converted - total_paid_converted
    
    recent_invoices = invoices[:5]
    for inv in recent_invoices:
        inv.balance = inv.total_amount - inv.paid_amount

    return ClientDashboardResponse(
        outstanding_amount=outstanding_amount,
        total_invoices=len(invoices),
        recent_invoices=recent_invoices
    )

@router.get("/invoices", response_model=List[InvoiceResponse])
async def get_client_invoices(
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client)
):
    """
    Retrieve all invoices for the authenticated client.
    """
    invoices = db.query(Invoice).filter(Invoice.client_id == current_client.id).order_by(Invoice.issue_date.desc()).all()
    
    for invoice in invoices:
        invoice.balance = invoice.total_amount - invoice.paid_amount
        
    return invoices

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_client_invoice_details(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client)
):
    """
    Retrieve details of a specific invoice for the authenticated client.
    """
    invoice = db.query(Invoice).options(joinedload(Invoice.client)).filter(
        Invoice.id == invoice_id,
        Invoice.client_id == current_client.id
    ).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found or does not belong to this client"
        )
        
    invoice.balance = invoice.total_amount - invoice.paid_amount
    return invoice

@router.get("/payments", response_model=List[PaymentResponse])
async def get_client_payments(
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client)
):
    """
    Retrieve all payments made for invoices associated with the authenticated client.
    """
    client_invoice_ids = db.query(Invoice.id).filter(Invoice.client_id == current_client.id).all()
    client_invoice_ids = [invoice_id[0] for invoice_id in client_invoice_ids]

    if not client_invoice_ids:
        return []

    payments = db.query(Payment).filter(
        Payment.invoice_id.in_(client_invoice_ids)
    ).order_by(Payment.payment_date.desc()).all()
    
    return payments

@router.put("/profile", response_model=ClientResponse)
async def update_client_profile(
    profile_data: ClientProfileUpdate,
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client)
):
    """
    Allow authenticated clients to update their own contact information.
    """
    for key, value in profile_data.dict(exclude_unset=True).items():
        setattr(current_client, key, value)
    
    db.commit()
    db.refresh(current_client)
    
    return current_client

@router.post("/payments/cashfree/orders", response_model=CashfreeOrderResponse)
async def create_cashfree_order(
    order_data: CashfreeOrderCreate,
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client)
):
    """
    Create a Cashfree order for an invoice.
    """
    if not settings.CASHFREE_APP_ID or not settings.CASHFREE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cashfree gateway is not configured."
        )

    invoice = db.query(Invoice).filter(
        Invoice.id == order_data.invoice_id,
        Invoice.client_id == current_client.id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found or does not belong to this client."
        )
    
    if invoice.payment_status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already fully paid."
        )
    
    balance_due = invoice.total_amount - invoice.paid_amount
    
    order_amount = min(order_data.amount, balance_due)
    order_amount = round(order_amount, 2)
    
    order_id = f"inv_{invoice.id}_{uuid.uuid4()}"
    return_url = f"http://localhost:3000/portal/invoices/{invoice.id}?cashfree_order_id={order_id}"

    headers = {
        "Content-Type": "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": settings.CASHFREE_APP_ID,
        "x-client-secret": settings.CASHFREE_SECRET_KEY,
    }
    
    payload = {
        "order_id": order_id,
        "order_amount": order_amount,
        "order_currency": invoice.currency,
        "customer_details": {
            "customer_id": str(current_client.id),
            "customer_email": current_client.email,
            "customer_phone": current_client.phone or "9999999999",
            "customer_name": current_client.name,
        },
        "order_meta": {
            "return_url": return_url,
        },
        "order_note": f"Payment for Invoice #{invoice.invoice_number}"
    }

    

    print(f"Creating Cashfree order with amount: {order_amount} {invoice.currency}")



    try:

        async with httpx.AsyncClient() as client:

            response = await client.post(f"{settings.CASHFREE_BASE_URL}/pg/orders", headers=headers, json=payload)

            response.raise_for_status()

            cashfree_order = response.json()            
            payment_session_id = cashfree_order.get("payment_session_id")
            # print(payment_session_id)
            if not payment_session_id:
                raise HTTPException(status_code=500, detail="Cashfree did not return a payment session ID.")

            return CashfreeOrderResponse(payment_session_id=payment_session_id)

    except httpx.HTTPStatusError as e:
        print(f"Error creating Cashfree order: {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Cashfree API error: {e.response.json().get('message', 'Unknown error')}"
        )
    except Exception as e:
        print(f"Error creating Cashfree order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create Cashfree order."
        )

async def get_paypal_access_token():
    if not settings.PAYPAL_CLIENT_ID or not settings.PAYPAL_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PayPal API credentials are not configured."
        )
    
    auth_string = f"{settings.PAYPAL_CLIENT_ID}:{settings.PAYPAL_CLIENT_SECRET}"
    encoded_auth = base64.b64encode(auth_string.encode('utf-8')).decode('utf-8')
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.PAYPAL_BASE_URL}/v1/oauth2/token",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {encoded_auth}"
            },
            data="grant_type=client_credentials"
        )
        response.raise_for_status()
        return response.json()["access_token"]

@router.post("/payments/paypal/orders", response_model=PayPalOrderResponse)
async def create_paypal_order(
    order_data: PayPalOrderCreate,
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client)
):
    """
    Create a PayPal order for an invoice.
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == order_data.invoice_id,
        Invoice.client_id == current_client.id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found or does not belong to this client."
        )
    
    if invoice.payment_status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already fully paid."
        )
    
    access_token = await get_paypal_access_token()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}"
                },
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "amount": {
                            "currency_code": invoice.currency,
                            "value": str(order_data.amount)
                        },
                        "invoice_id": invoice.invoice_number,
                        "description": f"Payment for Invoice #{invoice.invoice_number}"
                    }],
                    "application_context": {
                        "return_url": "http://localhost:3000/portal/invoices",
                        "cancel_url": "http://localhost:3000/portal/invoices"
                    }
                }
            )
            response.raise_for_status()
            paypal_order = response.json()
            
            approve_url = next((link['href'] for link in paypal_order['links'] if link['rel'] == 'approve'), None)
            
            if not approve_url:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Could not find approval URL for PayPal order."
                )

            return PayPalOrderResponse(
                order_id=paypal_order['id'],
                approve_url=approve_url
            )

    except httpx.HTTPStatusError as e:
        print(f"Error creating PayPal order: {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"PayPal API error: {e.response.json().get('message', 'Unknown error')}"
        )
    except Exception as e:
        print(f"Error creating PayPal order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create Cashfree order."
        )

@router.post("/payments/paypal/capture", status_code=status.HTTP_200_OK)
async def capture_paypal_payment(
    capture_data: PayPalCaptureRequest,
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client)
):
    """
    Captures a PayPal payment for a given order ID.
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == capture_data.invoice_id,
        Invoice.client_id == current_client.id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found or does not belong to this client."
        )
    
    access_token = await get_paypal_access_token()

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders/{capture_data.order_id}/capture",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {access_token}"
                }
            )
            response.raise_for_status()
            capture_response = response.json()

            if capture_response['status'] == 'COMPLETED':
                gross_amount = float(capture_response['purchase_units'][0]['payments']['captures'][0]['amount']['value'])
                
                existing_payment = db.query(Payment).filter(
                    Payment.gateway_payment_id == capture_response['id'],
                    Payment.gateway_name == "paypal"
                ).first()

                if existing_payment:
                    print(f"PayPal capture: Duplicate payment received for PayPal Order ID {capture_response['id']}.")
                    return {"status": "success", "message": "Payment already processed."}

                payment = Payment(
                    invoice_id=invoice.id,
                    payment_date=date.today(),
                    amount=gross_amount,
                    payment_method="Online - PayPal",
                    reference_number=capture_data.order_id,
                    gateway_payment_id=capture_response['id'],
                    gateway_name="paypal"
                )
                db.add(payment)

                invoice.paid_amount += gross_amount
                if invoice.paid_amount >= invoice.total_amount:
                    invoice.payment_status = "paid"
                    invoice.status = "paid"
                elif invoice.paid_amount > 0:
                    invoice.payment_status = "partial"
                
                db.commit()
                db.refresh(payment)
                db.refresh(invoice)

                return {"status": "success", "message": "PayPal payment captured successfully."}
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"PayPal payment not completed. Status: {capture_response['status']}"
                )

    except httpx.HTTPStatusError as e:
        print(f"Error capturing PayPal payment: {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"PayPal API error: {e.response.json().get('message', 'Unknown error')}"
        )
    except Exception as e:
        print(f"Error capturing PayPal payment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to capture PayPal payment."
        )

@router.get("/verify/cashfree-order/{order_id}", response_model=CashfreeOrderVerifyResponse)
async def verify_cashfree_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_client: Client = Depends(get_current_client)
):
    """
    Verify Cashfree order status and update payment records accordingly.
    """
    if not settings.CASHFREE_APP_ID or not settings.CASHFREE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cashfree gateway is not configured."
        )

    headers = {
        "Content-Type": "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": settings.CASHFREE_APP_ID,
        "x-client-secret": settings.CASHFREE_SECRET_KEY,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.CASHFREE_BASE_URL}/pg/orders/{order_id}",
                headers=headers
            )
            response.raise_for_status()
            cashfree_order = response.json()
            
            order_status = cashfree_order.get("order_status")
            cf_order_id = cashfree_order.get("cf_order_id")
            order_amount = cashfree_order.get("order_amount", 0)
            
            print(f"Cashfree order verification: Order {order_id} status: {order_status}")

            # Handle different order statuses
            if order_status == "PAID":
                # Check if payment already exists to prevent duplicates
                existing_payment = db.query(Payment).filter(
                    Payment.gateway_payment_id == cf_order_id,
                    Payment.gateway_name == "cashfree"
                ).first()

                if existing_payment:
                    return CashfreeOrderVerifyResponse(
                        status="success",
                        message="Payment already processed.",
                        payment_status="paid"
                    )

                # Extract invoice ID from order ID format: "inv_{invoice_id}_{uuid}"
                invoice_id = None
                if order_id.startswith("inv_"):
                    try:
                        parts = order_id.split("_")
                        if len(parts) >= 2:
                            invoice_id = int(parts[1])
                    except (ValueError, IndexError):
                        pass

                # Find the invoice associated with this order
                invoice = None
                if invoice_id:
                    invoice = db.query(Invoice).filter(
                        Invoice.id == invoice_id,
                        Invoice.client_id == current_client.id
                    ).first()

                if not invoice:
                    # Fallback: Try to find invoice by amount and client
                    client_invoices = db.query(Invoice).filter(
                        Invoice.client_id == current_client.id,
                        Invoice.total_amount >= order_amount * 0.99,  # Allow small rounding differences
                        Invoice.payment_status.in_(["pending", "partial", "overdue"])
                    ).all()

                    if not client_invoices:
                        return CashfreeOrderVerifyResponse(
                            status="error",
                            message="Could not find matching invoice for this payment."
                        )

                    # Use the most recent unpaid invoice that matches the amount
                    for inv in client_invoices:
                        if inv.balance >= order_amount:
                            invoice = inv
                            break
                    
                    if not invoice:
                        invoice = client_invoices[0]  # Use the first available as fallback

                # Create payment record
                payment = Payment(
                    invoice_id=invoice.id,
                    payment_date=date.today(),
                    amount=order_amount,
                    payment_method="Online - Cashfree",
                    reference_number=order_id,
                    gateway_payment_id=cf_order_id,
                    gateway_name="cashfree",
                    notes=f"Cashfree payment verified automatically"
                )
                db.add(payment)

                # Update invoice status and amounts
                invoice.paid_amount += order_amount
                if invoice.paid_amount >= invoice.total_amount:
                    invoice.payment_status = "paid"
                    invoice.status = "paid"
                elif invoice.paid_amount > 0:
                    invoice.payment_status = "partial"
                
                db.commit()
                db.refresh(payment)
                db.refresh(invoice)

                return CashfreeOrderVerifyResponse(
                    status="success",
                    message="Payment verified and recorded successfully.",
                    payment_status=invoice.payment_status
                )

            elif order_status == "ACTIVE":
                return CashfreeOrderVerifyResponse(
                    status="pending",
                    message="Payment is still pending. Please wait or try again later.",
                    payment_status="pending"
                )

            elif order_status in ["EXPIRED", "TERMINATED"]:
                return CashfreeOrderVerifyResponse(
                    status="failed",
                    message=f"Payment order {order_status.lower()}. Please try again.",
                    payment_status="failed"
                )

            else:
                return CashfreeOrderVerifyResponse(
                    status="unknown",
                    message=f"Unknown order status: {order_status}",
                    payment_status="unknown"
                )

    except httpx.HTTPStatusError as e:
        print(f"Error verifying Cashfree order: {e.response.text}")
        if e.response.status_code == 404:
            return CashfreeOrderVerifyResponse(
                status="error",
                message="Order not found. It may have been cancelled or expired."
            )
        else:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Cashfree API error: {e.response.json().get('message', 'Unknown error')}"
            )
    except Exception as e:
        print(f"Error verifying Cashfree order: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify Cashfree order."
        )
