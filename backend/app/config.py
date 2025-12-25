

from pydantic_settings import BaseSettings
import os
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOWED_ORIGINS: str
    ENVIRONMENT: str
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    CASHFREE_APP_ID: Optional[str] = None
    CASHFREE_SECRET_KEY: Optional[str] = None
    CASHFREE_BASE_URL: str = "https://sandbox.cashfree.com"
    CASHFREE_CHECKOUT_URL: Optional[str] = "https://checkout.sandbox.cashfree.com"
    CASHFREE_WEBHOOK_SECRET: Optional[str] = None
    PAYPAL_CLIENT_ID: Optional[str] = None
    PAYPAL_CLIENT_SECRET: Optional[str] = None
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com" # Default to sandbox
    
    model_config = {
        "env_file": ".env"
    }

settings = Settings()

class ProductionConfig:
    DEBUG = False
    # Use DATABASE_URL from environment
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
