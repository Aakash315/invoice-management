from pydantic import BaseModel, EmailStr, ConfigDict # Import ConfigDict
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime
    
    model_config = ConfigDict( # Use ConfigDict
        from_attributes = True,
        exclude = {'clients', 'invoices', 'password_hash'}
    )


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
