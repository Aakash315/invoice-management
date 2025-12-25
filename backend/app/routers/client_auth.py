from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import secrets # For generating tokens

from fastapi_mail import FastMail, MessageSchema # For sending emails

from app.database import get_db
from app.models.client import Client
from app.schemas.client import ClientResponse, ClientToken
from app.schemas.user import Token
from app.utils.auth import verify_password, create_access_token, get_password_hash # get_password_hash added
from app.config import settings
from app.utils.mail import conf # For FastMail config
from pydantic import BaseModel, EmailStr # EmailStr added for validation

# Schemas for password reset
class ClientPasswordResetRequest(BaseModel):
    email: EmailStr

class ClientPasswordReset(BaseModel):
    token: str
    new_password: str

router = APIRouter(prefix="/client-auth", tags=["Client Authentication"])

@router.post("/token", response_model=ClientToken) # Use ClientToken here
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.email == form_data.username).first()
    if not client or not client.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, client.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not client.is_portal_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client portal access is not enabled for this account",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # We'll differentiate client tokens by adding a 'client_id' to the payload
    access_token = create_access_token(
        data={"sub": client.email, "client_id": client.id}, expires_delta=access_token_expires
    )
    return ClientToken(access_token=access_token, token_type="bearer", client=ClientResponse.from_orm(client))


@router.post("/request-password-reset", status_code=status.HTTP_200_OK)
async def request_password_reset(
    request_data: ClientPasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request a password reset email for a client.
    """
    client = db.query(Client).filter(Client.email == request_data.email).first()
    if not client:
        # For security, don't reveal if email exists or not
        return {"message": "If an account with that email exists, a password reset email will be sent."}
    
    # Generate a secure token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1) # Token valid for 1 hour

    client.reset_password_token = token
    client.reset_password_expires = expires_at
    db.commit()
    db.refresh(client)

    # Construct reset URL
    reset_url = f"http://localhost:3000/portal/reset-password?token={token}" # TODO: Make frontend URL configurable
    
    # Send email
    message = MessageSchema(
        subject="Client Portal Password Reset Request",
        recipients=[request_data.email],
        body=f"""
            <p>Dear {client.name},</p>
            <p>You have requested a password reset for your Invoice Management Client Portal account.</p>
            <p>Please click on the link below to reset your password:</p>
            <p><a href="{reset_url}">{reset_url}</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
            <br>
            <p>Regards,</p>
            <p>Invoice Management Team</p>
        """,
        subtype="html"
    )
    
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send password reset email."
        )

    return {"message": "If an account with that email exists, a password reset email will be sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    reset_data: ClientPasswordReset,
    db: Session = Depends(get_db)
):
    """
    Reset client's password using a valid token.
    """
    client = db.query(Client).filter(
        Client.reset_password_token == reset_data.token,
        Client.reset_password_expires > datetime.utcnow()
    ).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token."
        )
    
    # Hash new password and update
    client.password_hash = get_password_hash(reset_data.new_password)
    client.reset_password_token = None
    client.reset_password_expires = None
    db.commit()
    db.refresh(client)

    return {"message": "Password has been reset successfully."}