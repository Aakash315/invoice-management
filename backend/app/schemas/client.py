from pydantic import BaseModel, EmailStr, ConfigDict # Import ConfigDict
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

class ClientUpdate(ClientBase):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_portal_enabled: Optional[bool] = None



class ClientResponse(ClientBase):
    id: int
    is_portal_enabled: Optional[bool] = None # Make is_portal_enabled optional
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict( # Use ConfigDict
        from_attributes = True,
        exclude = {'created_by_user', 'invoices', 'password_hash'} # Exclude password_hash for security
    )

class ClientToken(BaseModel):
    access_token: str
    token_type: str
    client: ClientResponse # Renamed 'user' to 'client' for clarity
