from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None


class UserCreate(UserBase):
    password: str
    risk_score: Optional[int] = 0
    risk_category: Optional[str] = "unknown"
    profile_notes: Optional[str] = None
    kyc_status: Optional[str] = "unverified"
    profile_completed: Optional[bool] = False


class UserOut(UserBase):
    id: int
    username: Optional[str]
    risk_score: int
    risk_category: str
    profile_notes: Optional[str]
    kyc_status: str
    profile_completed: bool
    allocation: Optional[str]

    class Config:
        orm_mode = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshToken(BaseModel):
    refresh_token: str
