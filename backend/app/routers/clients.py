from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.client import Client, DepositReturnHistory
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse, DepositReturnHistoryResponse, ClientDepositHistoryResponse
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

@router.put("/{client_id}/return-deposit", response_model=ClientResponse)
async def return_deposit(
    client_id: int,
    return_type: str = Query(default="cash", description="Return type: cash, bank_transfer, upi, check, other"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return the deposit for a client.
    This will reset the deposit fields and create a history record.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    if not client.has_deposit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client does not have a deposit to return"
        )
    
    # Store the deposit amount before resetting
    returned_amount = client.deposit_amount or 0
    
    # Create deposit return history record
    deposit_return = DepositReturnHistory(
        client_id=client.id,
        amount=returned_amount,
        returned_by=current_user.id,
        returned_date=datetime.utcnow(),
        return_type=return_type,
        notes=f"Deposit returned via {return_type.replace('_', ' ').title()} for {client.name}"
    )
    db.add(deposit_return)
    
    # Reset deposit fields
    client.has_deposit = False
    client.deposit_amount = None
    client.deposit_date = None
    client.deposit_type = None
    
    db.commit()
    db.refresh(client)
    
    return client

@router.get("/{client_id}/deposit-history", response_model=ClientDepositHistoryResponse)
async def get_client_deposit_history(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the deposit history for a specific client.
    Returns current deposit status and all return history records.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Get all deposit return history for this client
    deposit_returns = db.query(DepositReturnHistory).filter(
        DepositReturnHistory.client_id == client_id
    ).order_by(DepositReturnHistory.returned_date.desc()).all()
    
    return ClientDepositHistoryResponse(
        client_id=client.id,
        client_name=client.name,
        company=client.company,
        current_deposit=client.deposit_amount if client.has_deposit else None,
        current_has_deposit=client.has_deposit,
        deposit_returns=deposit_returns
    )

@router.get("/deposit-history/all", response_model=List[dict])
async def get_all_deposit_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all deposit return history across all clients.
    """
    results = []
    clients = db.query(Client).all()
    
    for client in clients:
        deposit_returns = db.query(DepositReturnHistory).filter(
            DepositReturnHistory.client_id == client.id
        ).order_by(DepositReturnHistory.returned_date.desc()).all()
        
        for ret in deposit_returns:
            results.append({
                'id': ret.id,
                'client_id': client.id,
                'client_name': client.name,
                'company': client.company,
                'amount': ret.amount,
                'return_type': ret.return_type,
                'returned_date': ret.returned_date,
                'returned_by': ret.returned_by,
                'notes': ret.notes,
                'created_at': ret.created_at
            })
    
    # Sort by returned date descending
    results.sort(key=lambda x: x['returned_date'] if x['returned_date'] else datetime.min, reverse=True)
    
    return results

@router.put("/deposit-history/{history_id}", response_model=dict)
async def update_deposit_history(
    history_id: int,
    amount: float = Query(..., description="Amount returned"),
    return_type: str = Query(..., description="Return type: cash, bank_transfer, upi, check, other"),
    notes: str = Query(default="", description="Notes for the return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a deposit return history record.
    """
    deposit_return = db.query(DepositReturnHistory).filter(DepositReturnHistory.id == history_id).first()
    if not deposit_return:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deposit return history not found"
        )
    
    # Update fields
    deposit_return.amount = amount
    deposit_return.return_type = return_type
    deposit_return.notes = notes
    
    db.commit()
    db.refresh(deposit_return)
    
    # Get client info for response
    client = db.query(Client).filter(Client.id == deposit_return.client_id).first()
    
    return {
        'id': deposit_return.id,
        'client_id': client.id,
        'client_name': client.name,
        'company': client.company,
        'amount': deposit_return.amount,
        'return_type': deposit_return.return_type,
        'returned_date': deposit_return.returned_date,
        'returned_by': deposit_return.returned_by,
        'notes': deposit_return.notes,
        'created_at': deposit_return.created_at
    }

@router.delete("/deposit-history/{history_id}", status_code=status.HTTP_200_OK)
async def delete_deposit_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a deposit return history record.
    """
    deposit_return = db.query(DepositReturnHistory).filter(DepositReturnHistory.id == history_id).first()
    if not deposit_return:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deposit return history not found"
        )
    
    db.delete(deposit_return)
    db.commit()
    
    return {'message': 'Deposit return history deleted successfully'}
