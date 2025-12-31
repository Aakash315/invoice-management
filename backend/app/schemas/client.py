from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

class ClientBase(BaseModel):
    name: str
    company: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    gstin: Optional[str] = None
    base_currency: Optional[str] = 'INR'
    document_type: Optional[str] = None
    document_path: Optional[str] = None

class ClientCreate(ClientBase):
    password: Optional[str] = None
    is_portal_enabled: Optional[bool] = False

class ClientProfileUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    gstin: Optional[str] = None
    base_currency: Optional[str] = None
    password: Optional[str] = None
    is_portal_enabled: Optional[bool] = None
    document_type: Optional[str] = None
    document_path: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    is_portal_enabled: Optional[bool] = None
    document_type: Optional[str] = None
    document_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes = True,
        exclude = {'created_by_user', 'invoices', 'password_hash'}
    )

class ClientToken(BaseModel):
    access_token: str
    token_type: str
    client: ClientResponse

