from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.utils.dependencies import get_current_user
from app.utils.auth import get_password_hash
from app.utils.mail import send_generic_email
from pathlib import Path
import os
import uuid
from datetime import datetime

# Configure upload directory
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "clients"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.get("", response_model=List[ClientResponse])
async def get_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clients = db.query(Client).order_by(Client.created_at.desc()).all()
    return clients

@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client

@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    hashed_password = None
    if client_data.password:
        hashed_password = get_password_hash(client_data.password)

    client_dict = client_data.dict(exclude_unset=True)
    if "password" in client_dict:
        del client_dict["password"] # Remove plain password before creating client object
    if "is_portal_enabled" in client_dict: # New: Remove is_portal_enabled from dict
        del client_dict["is_portal_enabled"]

    client = Client(
        **client_dict,
        password_hash=hashed_password,
        is_portal_enabled=client_data.is_portal_enabled if client_data.is_portal_enabled is not None else False,
        created_by=current_user.id
    )
    
    db.add(client)
    db.commit()
    db.refresh(client)

    # Store plain-text password for email before it's gone
    plain_password = client_data.password if client_data.password else "Not set"

    # Send welcome email
    try:
        template_path = Path(__file__).parent.parent / 'templates/client_welcome.html'
        with open(template_path, 'r', encoding='utf-8') as file:
            template_body = file.read()

        email_body = template_body.replace('{{client_name}}', client.name)
        email_body = email_body.replace('{{client_email}}', client.email)
        email_body = email_body.replace('{{client_password}}', plain_password)

        print("Email body:", email_body)

        await send_generic_email(
            subject="Welcome to our platform!",
            recipients=[client.email],
            body=email_body
        )
    except Exception as e:
        # Log the error, but don't block the response
        print(f"Failed to send welcome email to {client.email}: {e}")
    
    return client

@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Update fields
    for key, value in client_data.dict(exclude_unset=True).items():
        if key == "password" and value is not None:
            setattr(client, "password_hash", get_password_hash(value))
        elif key != "password": # Exclude the plain password field
            setattr(client, key, value)
    
    db.commit()
    db.refresh(client)
    
    return client

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    db.delete(client)
    db.commit()
    
    return None

@router.put("/{client_id}/document", response_model=ClientResponse)
async def upload_client_document(
    client_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a document for a client (ID Proof, Address Proof, Agreement, etc.)"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Validate document type
    valid_types = ['aadhar_card', 'pan_card', 'passport', 'voter_id', 'driving_licence', 'other']
    if document_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Validate file type (allow images and PDFs)
    allowed_content_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if file.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only images (JPEG, PNG, GIF) and PDF are allowed."
        )
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{client_id}_{document_type}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Update client with document info
    client.document_type = document_type
    client.document_path = str(file_path)
    
    db.commit()
    db.refresh(client)
    
    return client

@router.delete("/{client_id}/document", response_model=ClientResponse)
async def delete_client_document(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a client's document"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Delete file if exists
    if client.document_path and os.path.exists(client.document_path):
        try:
            os.remove(client.document_path)
        except Exception as e:
            print(f"Failed to delete file: {e}")
    
    # Clear document fields
    client.document_type = None
    client.document_path = None
    
    db.commit()
    db.refresh(client)
    
    return client

@router.get("/{client_id}/document")
async def get_client_document(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get client's document info and serve the file if exists"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    if not client.document_path or not os.path.exists(client.document_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Return document info with file as response
    from fastapi.responses import FileResponse
    return FileResponse(
        path=client.document_path,
        filename=os.path.basename(client.document_path),
        media_type='application/octet-stream'
    )
