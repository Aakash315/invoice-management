import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.client import Client
from datetime import date
import json
import hmac
import hashlib
from unittest.mock import patch, MagicMock
from app.config import settings

# Fixtures from conftest.py: client, db_session, test_user

@pytest.fixture
def test_invoice_for_webhook(db_session: Session, test_user, test_client_entity: Client):
    # Create an invoice for testing webhooks
    invoice = Invoice(
        invoice_number="WEBHOOK-001",
        client_id=test_client_entity.id,
        issue_date=date.today(),
        due_date=date.today(),
        total_amount=500.0,
        paid_amount=0.0,
        currency="INR",
        status="sent",
        payment_status="unpaid",
        created_by=test_user.id
    )
    db_session.add(invoice)
    db_session.commit() # Re-introduce commit
    db_session.refresh(invoice)
    yield invoice
    # Cleanup is handled by transaction.rollback in db_session fixture

@patch('app.routers.webhooks.settings')
def test_razorpay_webhook_success(mock_settings, client: TestClient, db_session: Session, test_invoice_for_webhook: Invoice, test_client_entity: Client):
    # Mock settings for webhook secret
    mock_settings.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret"

    # Simulate Razorpay payment.captured event
    payload = {
        "entity": "event",
        "account_id": "acc_test",
        "event": "payment.captured",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_payment_id",
                    "entity": "payment",
                    "amount": 50000, # in paisa
                    "currency": "INR",
                    "status": "captured",
                    "order_id": "order_test_order_id",
                    "international": False,
                    "method": "upi",
                    "amount_refunded": 0,
                    "refund_status": None,
                    "captured": True,
                    "description": "Payment for Invoice #WEBHOOK-001",
                    "card_id": None,
                    "bank": None,
                    "wallet": None,
                    "vpa": "test@example",
                    "email": "test@example.com",
                    "notes": {
                        "invoice_id": str(test_invoice_for_webhook.id),
                        "client_id": str(test_client_entity.id) # Use actual client ID
                    },
                    "fee": 1000,
                    "tax": 180,
                    "error_code": None,
                    "error_description": None,
                    "created_at": 1678886400
                }
            },
            "order": {
                "entity": {
                    "id": "order_test_order_id",
                    "entity": "order",
                    "amount": 50000,
                    "currency": "INR",
                    "receipt": "invoice_WEBHOOK-001",
                    "status": "paid",
                    "attempts": 1,
                    "notes": {
                        "invoice_id": str(test_invoice_for_webhook.id),
                        "client_id": str(test_client_entity.id) # Use actual client ID
                    },
                    "created_at": 1678886400
                }
            }
        },
        "created_at": 1678886400
    }
    
    json_payload = json.dumps(payload)
    # Generate expected signature
    expected_signature = hmac.new(
        key=bytes(mock_settings.RAZORPAY_WEBHOOK_SECRET, 'utf-8'),
        msg=json_payload.encode('utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()

    response = client.post(
        "/webhooks/razorpay",
        content=json_payload,
        headers={
            "X-Razorpay-Signature": expected_signature,
            "Content-Type": "application/json"
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Verify payment and invoice updates in DB
    payment = db_session.query(Payment).filter(
        Payment.gateway_payment_id == "pay_test_payment_id",
        Payment.gateway_name == "razorpay"
    ).first()
    assert payment is not None
    assert payment.amount == 500.0
    assert payment.invoice_id == test_invoice_for_webhook.id

    invoice = db_session.query(Invoice).filter(Invoice.id == test_invoice_for_webhook.id).first()
    assert invoice.paid_amount == 500.0
    assert invoice.payment_status == "paid"
    assert invoice.status == "paid"

@patch('app.routers.webhooks.settings')
def test_razorpay_webhook_invalid_signature(mock_settings, client: TestClient, db_session: Session):
    mock_settings.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret"

    payload = {"event": "payment.captured", "payload": {}}
    json_payload = json.dumps(payload)
    
    response = client.post(
        "/webhooks/razorpay",
        content=json_payload,
        headers={
            "X-Razorpay-Signature": "invalid_signature",
            "Content-Type": "application/json"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid webhook signature."

@patch('app.routers.webhooks.settings')
def test_razorpay_webhook_missing_signature(mock_settings, client: TestClient, db_session: Session):
    mock_settings.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret"

    payload = {"event": "payment.captured", "payload": {}}
    json_payload = json.dumps(payload)
    
    response = client.post(
        "/webhooks/razorpay",
        content=json_payload,
        headers={
            "Content-Type": "application/json"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Webhook signature missing."

@patch('app.routers.webhooks.settings')
def test_razorpay_webhook_unconfigured_secret(mock_settings, client: TestClient, db_session: Session):
    mock_settings.RAZORPAY_WEBHOOK_SECRET = None # Simulate unconfigured secret

    payload = {"event": "payment.captured", "payload": {}}
    json_payload = json.dumps(payload)
    
    response = client.post(
        "/webhooks/razorpay",
        content=json_payload,
        headers={
            "X-Razorpay-Signature": "some_signature",
            "Content-Type": "application/json"
        }
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Razorpay webhook secret is not configured."
