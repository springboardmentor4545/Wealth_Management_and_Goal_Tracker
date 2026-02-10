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
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshToken(BaseModel):
    refresh_token: str


# --- GOAL SCHEMAS ---

from datetime import datetime

class GoalBase(BaseModel):
    title: str
    target_amount: int
    target_date: datetime
    monthly_contribution: Optional[int] = 0

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[int] = None
    target_date: Optional[datetime] = None
    monthly_contribution: Optional[int] = None
    current_amount: Optional[int] = None

class GoalOut(GoalBase):
    id: int
    user_id: int
    current_amount: int
    created_at: datetime
    
    # Calculated Fields
    duration_months: Optional[float] = 0.0
    required_monthly_investment: Optional[float] = 0.0
    progress_percentage: Optional[float] = 0.0

    class Config:
        from_attributes = True


# --- PORTFOLIO SCHEMAS ---

class TransactionBase(BaseModel):
    symbol: str
    transaction_type: str # "BUY" or "SELL"
    quantity: float
    price_per_unit: float
    asset_type: Optional[str] = "Stock"

class TransactionCreate(TransactionBase):
    pass

class TransactionOut(TransactionBase):
    id: int
    user_id: int
    total_amount: float
    date: datetime

    class Config:
        from_attributes = True

class InvestmentOut(BaseModel):
    symbol: str
    asset_type: str
    quantity: float
    average_buy_price: float
    last_price: Optional[float] = 0.0
    last_price_updated_at: Optional[datetime] = None
    current_value: Optional[float] = 0.0

    class Config:
        from_attributes = True


# --- SIMULATION SCHEMAS ---

class SimulationBase(BaseModel):
    title: str
    assumptions: dict # JSON as dict
    
class SimulationCreate(SimulationBase):
    pass

class SimulationOut(SimulationBase):
    id: int
    user_id: int
    results: dict # JSON as dict
    created_at: datetime

    class Config:
        from_attributes = True

