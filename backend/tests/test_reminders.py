
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app import models
from app.main import app
from app.database import get_db, Base, engine
from app.utils.dependencies import get_current_user
from app.config import get_settings
import os
from dotenv import load_dotenv

# Load the test environment variables
load_dotenv(".env.test")

# Set up the test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Override settings for testing
def get_test_settings():
    return get_settings(env_file=".env.test")

# Test database dependency
def override_get_db():
    try:
        db = Session(autocommit=False, autoflush=False, bind=engine)
        yield db
    finally:
        db.close()

# Test current user dependency
def override_get_current_user():
    db = next(override_get_db())
    user = db.query(models.User).filter(models.User.email == "test@example.com").first()
    if user:
        return user
    # If no user, create one for testing
    user = models.User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        password_hash="testpassword",
        is_superuser=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Clean up previous test database if it exists
    if os.path.exists("./test.db"):
        os.remove("./test.db")
    
    # Create the test database and tables
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown the test database
    if os.path.exists("./test.db"):
        os.remove("./test.db")

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user
app.dependency_overrides[get_settings] = get_test_settings

client = TestClient(app)

@pytest.fixture
def db_session():
    return next(override_get_db())

@pytest.fixture
def test_user(db_session):
    return override_get_current_user()

def test_send_manual_reminder_when_reminders_are_disabled(db_session, test_user, capsys):
    # 1. Create a client for the user
    client_data = {
        "name": "Test Client",
        "email": "client@example.com",
        "user_id": test_user.id
    }
    client_res = client.post("/api/clients/", json=client_data)
    assert client_res.status_code == 200, client_res.text
    client_id = client_res.json()["id"]

    # 2. Create an invoice for the client
    invoice_data = {
        "client_id": client_id,
        "due_date": "2025-12-31",
        "amount": 100.0,
        "items": [{"description": "Test Item", "quantity": 1, "price": 100.0}]
    }
    invoice_res = client.post("/api/invoices/", json=invoice_data)
    assert invoice_res.status_code == 200, invoice_res.text
    invoice_id = invoice_res.json()["id"]
    invoice_number = invoice_res.json()["invoice_number"]

    # 3. Disable reminders for the user
    settings_data = {
        "enabled": False,
        "remind_before_due": [1, 3, 7],
        "remind_after_due": [1, 3, 7]
    }
    # Try to get existing settings first
    settings_res = client.get("/api/reminders/settings")
    if settings_res.status_code == 404:
        # If no settings exist, create them
        client.post("/api/reminders/settings", json=settings_data)
    else:
         # If settings exist, update them
        client.put("/api/reminders/settings", json={"enabled": False})


    # 4. Send a manual reminder
    reminder_res = client.post(f"/api/reminders/{invoice_id}/send-manual-reminder?reminder_type=friendly")
    
    # 5. Assert that the reminder was sent successfully
    assert reminder_res.status_code == 202, reminder_res.text
    assert reminder_res.json() == {"message": f"Manual 'friendly' reminder for invoice {invoice_id} initiated in background."}

    # 6. Assert that the mock email was "sent"
    captured = capsys.readouterr()
    assert "--- MOCK EMAIL ---" in captured.out
    assert "To: ['client@example.com']" in captured.out
    assert f"Subject: Reminder: Invoice {invoice_number} is due soon" in captured.out
