from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime, date
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
    # Deposit fields
    has_deposit: Optional[bool] = False
    deposit_amount: Optional[float] = None
    deposit_date: Optional[date] = None
    deposit_type: Optional[str] = None

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
    # Deposit fields
    has_deposit: Optional[bool] = None
    deposit_amount: Optional[float] = None
    deposit_date: Optional[date] = None
    deposit_type: Optional[str] = None

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

class DepositReturnHistoryBase(BaseModel):
    amount: float
    notes: Optional[str] = None

class DepositReturnHistoryCreate(DepositReturnHistoryBase):
    pass

class DepositReturnHistoryResponse(DepositReturnHistoryBase):
    id: int
    client_id: int
    returned_date: datetime
    returned_by: Optional[int] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ClientDepositHistoryResponse(BaseModel):
    client_id: int
    client_name: str
    company: Optional[str]
    current_deposit: Optional[float] = None
    current_has_deposit: bool = False
    deposit_returns: list[DepositReturnHistoryResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

