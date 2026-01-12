from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    kyc_status: bool
    risk_score: int
    profile_completed: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str    