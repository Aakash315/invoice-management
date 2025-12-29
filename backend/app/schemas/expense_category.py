from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#3B82F6"
    icon: str = "folder"
    is_active: bool = True

class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass

class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None

class ExpenseCategoryResponse(ExpenseCategoryBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes = True,
        exclude = {'created_by_user', 'expenses'}
    )
