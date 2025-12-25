import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.client import Client
from app.utils.auth import get_password_hash
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, AsyncMock

# Fixture `client` and `db_session` are from conftest.py

def test_client_login_success(client: TestClient, db_session: Session, test_client_entity: Client):
    response = client.post(
        "/api/client-auth/token",
        data={"username": test_client_entity.email, "password": "clientpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["client"]["email"] == test_client_entity.email
def test_client_login_invalid_credentials(client: TestClient, db_session: Session):
    response = client.post(
        "/api/client-auth/token",
        data={"username": "nonexistent@example.com", "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_client_login_portal_disabled(client: TestClient, db_session: Session, test_user): # Add test_user
    # Create a client with portal disabled
    disabled_client = Client(
        name="Disabled Client",
        company="Disabled Co.",
        email="disabled@example.com",
        password_hash=get_password_hash("disabledpassword"),
        is_portal_enabled=False,
        created_by=test_user.id # Assign created_by
    )
    db_session.add(disabled_client)
    db_session.commit()
    db_session.refresh(disabled_client)

    response = client.post(
        "/api/client-auth/token",
        data={"username": disabled_client.email, "password": "disabledpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Client portal access is not enabled for this account"

@patch('app.routers.client_auth.FastMail') # Patch the FastMail class where it's instantiated
def test_request_password_reset_success(mock_fastmail_class: MagicMock, client: TestClient, db_session: Session, test_client_entity: Client):
    # Ensure send_message is mocked
    mock_fastmail_instance = mock_fastmail_class.return_value
    mock_fastmail_instance.send_message = AsyncMock(return_value=None) # Use AsyncMock

    response = client.post(
        "/api/client-auth/request-password-reset",
        json={"email": test_client_entity.email}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "If an account with that email exists, a password reset email will be sent."

    # Verify token and expiry are set in DB
    client_in_db = db_session.query(Client).filter(Client.email == test_client_entity.email).first()
    assert client_in_db.reset_password_token is not None
    assert client_in_db.reset_password_expires > datetime.utcnow()

def test_request_password_reset_nonexistent_email(client: TestClient, db_session: Session):
    response = client.post(
        "/api/client-auth/request-password-reset",
        json={"email": "nonexistent@example.com"}
    )
    # Should return success message for security reasons
    assert response.status_code == 200
    assert response.json()["message"] == "If an account with that email exists, a password reset email will be sent."

def test_reset_password_success(client: TestClient, db_session: Session, test_client_entity: Client):
    # Manually set a token for the test client
    token = "test_reset_token_123"
    expires_at = datetime.utcnow() + timedelta(hours=1)
    test_client_entity.reset_password_token = token
    test_client_entity.reset_password_expires = expires_at
    db_session.add(test_client_entity)
    db_session.commit()
    db_session.refresh(test_client_entity)

    new_password = "newsecurepassword"
    response = client.post(
        "/api/client-auth/reset-password",
        json={"token": token, "new_password": new_password}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password has been reset successfully."

    # Verify password is changed and token cleared
    client_in_db = db_session.query(Client).filter(Client.email == test_client_entity.email).first()
    assert client_in_db.password_hash != get_password_hash("clientpassword") # Old password hash should be different
    assert client_in_db.reset_password_token is None
    assert client_in_db.reset_password_expires is None
    # Try logging in with new password
    login_response = client.post(
        "/api/client-auth/token",
        data={"username": client_in_db.email, "password": new_password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_response.status_code == 200

def test_reset_password_invalid_token(client: TestClient, db_session: Session):
    response = client.post(
        "/api/client-auth/reset-password",
        json={"token": "invalid_token", "new_password": "anypassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired password reset token."

def test_reset_password_expired_token(client: TestClient, db_session: Session, test_client_entity: Client):
    # Manually set an expired token
    token = "expired_token_123"
    expires_at = datetime.utcnow() - timedelta(hours=1)
    test_client_entity.reset_password_token = token
    test_client_entity.reset_password_expires = expires_at
    db_session.add(test_client_entity)
    db_session.commit()
    db_session.refresh(test_client_entity)

    response = client.post(
        "/api/client-auth/reset-password",
        json={"token": token, "new_password": "newpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired password reset token."
