import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.client import Client
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.utils.auth import get_password_hash # New import
from datetime import date, datetime

# Fixtures from conftest.py: client, db_session, test_user, test_client_entity, test_client_auth_token

@pytest.fixture
def test_invoice(db_session: Session, test_client_entity: Client, test_user): # Add test_user dependency
    # Create an invoice for the test client
    invoice = Invoice(
        invoice_number="CLI-001",
        client_id=test_client_entity.id,
        issue_date=date.today(),
        due_date=date.today(),
        total_amount=100.0,
        paid_amount=0.0,
        currency="USD",
        status="sent",
        payment_status="unpaid",
        created_by=test_user.id # Assign test_user's ID
    )
    db_session.add(invoice)
    db_session.commit() # Re-introduce commit
    db_session.refresh(invoice)
    yield invoice
    # Cleanup is handled by transaction.rollback in db_session fixture

@pytest.fixture
def test_payment(db_session: Session, test_invoice: Invoice):
    # Create a payment for the test invoice
    payment = Payment(
        invoice_id=test_invoice.id,
        payment_date=date.today(),
        amount=50.0,
        payment_method="Bank Transfer",
        reference_number="REF123",
        gateway_name="manual"
    )
    db_session.add(payment)
    db_session.flush() # Use flush instead of commit
    db_session.refresh(payment)
    yield payment
    # Cleanup is handled by transaction.rollback in db_session fixture


def test_get_client_invoices(client: TestClient, db_session: Session, test_client_entity: Client, test_invoice: Invoice, test_client_auth_token: str):
    response = client.get(
        "/api/client-portal/invoices",
        headers={"Authorization": f"Bearer {test_client_auth_token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == test_invoice.id

def test_get_client_invoice_details(client: TestClient, db_session: Session, test_client_entity: Client, test_invoice: Invoice, test_client_auth_token: str):
    response = client.get(
        f"/api/client-portal/invoices/{test_invoice.id}",
        headers={"Authorization": f"Bearer {test_client_auth_token}"}
    )
    assert response.status_code == 200
    assert response.json()["id"] == test_invoice.id
    assert response.json()["client_id"] == test_client_entity.id

def test_get_client_invoice_details_unauthorized_client(client: TestClient, db_session: Session, test_invoice: Invoice, test_client_auth_token: str, test_user): # Add test_user
    # Create another client and try to access the first client's invoice
    other_client = Client(
        name="Other Client",
        company="Other Co.",
        email="other@example.com",
        password_hash=get_password_hash("otherpassword"),
        is_portal_enabled=True,
        created_by=test_user.id # Assign created_by
    )
    db_session.add(other_client)
    db_session.commit() # Commit to make it visible
    db_session.refresh(other_client)

    # Need a token for the *other* client to attempt unauthorized access
    other_client_token_response = client.post(
        "/api/client-auth/token",
        data={"username": other_client.email, "password": "otherpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert other_client_token_response.status_code == 200
    other_client_auth_token = other_client_token_response.json()["access_token"]


    response = client.get(
        f"/api/client-portal/invoices/{test_invoice.id}",
        headers={"Authorization": f"Bearer {other_client_auth_token}"} # Use other client's token
    )
    assert response.status_code == 404 # Should not be found

def test_get_client_payments(client: TestClient, db_session: Session, test_client_entity: Client, test_invoice: Invoice, test_payment: Payment, test_client_auth_token: str):
    response = client.get(
        "/api/client-portal/payments",
        headers={"Authorization": f"Bearer {test_client_auth_token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == test_payment.id
    assert response.json()[0]["invoice_id"] == test_invoice.id

def test_update_client_profile(client: TestClient, db_session: Session, test_client_entity: Client, test_client_auth_token: str):
    updated_name = "Updated Client Name"
    updated_phone = "9876543210"
    
    response = client.put(
        "/api/client-portal/profile",
        json={"name": updated_name, "phone": updated_phone},
        headers={"Authorization": f"Bearer {test_client_auth_token}"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == updated_name
    assert response.json()["phone"] == updated_phone

    client_in_db = db_session.query(Client).filter(Client.id == test_client_entity.id).first()
    assert client_in_db.name == updated_name
    assert client_in_db.phone == updated_phone
    assert client_in_db.email == test_client_entity.email # Email should not change
