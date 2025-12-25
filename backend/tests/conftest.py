from dotenv import load_dotenv
import os
# Load environment variables from .env.test for testing
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env.test'))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker # Added Session
from app.database import Base, get_db
from app.main import app
from fastapi.testclient import TestClient
from app.config import settings
from app.models.user import User
from app.models.client import Client
from app.utils.auth import get_password_hash
from datetime import datetime, timedelta

# Use a separate test database
TEST_DATABASE_URL = "sqlite:///./test_invoicemgmt.db"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    # Create tables in the test database
    Base.metadata.create_all(bind=engine)
    yield engine
    # Drop tables after tests are done (optional, but good for clean slate)
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function") # Changed scope to function to match db_session
def client(db_session):
    # Dependency override for database session
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear() # Clear overrides after test

@pytest.fixture(scope="function")
def test_user(db_session: Session): # Add type hint for clarity
    # Create a test user
    hashed_password = get_password_hash("testpassword")
    user = User(
        name="Test User",
        email="test@example.com",
        password_hash=hashed_password,
        role="admin"
    )
    db_session.add(user)
    db_session.commit() # Re-introduce commit
    db_session.refresh(user)
    yield user
    # Cleanup is handled by transaction.rollback in db_session fixture

@pytest.fixture(scope="function")
def test_client_entity(db_session: Session, test_user: User): # Add type hints for clarity
    # Create a test client entity for the portal
    hashed_password = get_password_hash("clientpassword")
    client_entity = Client(
        name="Test Client",
        company="Test Company",
        email="client@example.com",
        password_hash=hashed_password,
        is_portal_enabled=True,
        created_by=test_user.id # Assign the test_user's ID
    )
    db_session.add(client_entity)
    db_session.commit() # Re-introduce commit
    db_session.refresh(client_entity)
    yield client_entity
    # Cleanup is handled by transaction.rollback in db_session fixture

@pytest.fixture(scope="function")
def test_client_auth_token(client, test_client_entity):
    # Get an auth token for the test client
    response = client.post(
        "/api/client-auth/token",
        data={"username": test_client_entity.email, "password": "clientpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "client" in response.json() # Also check for 'client' key
    return response.json()["access_token"]

@pytest.fixture(scope="function")
def test_user_auth_token(client, test_user):
    # Get an auth token for the test user
    response = client.post(
        "/api/auth/token",
        data={"username": test_user.email, "password": "testpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]
