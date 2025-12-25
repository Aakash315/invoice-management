from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from app.utils.dependencies import get_current_user
from app.utils.auth import get_password_hash

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