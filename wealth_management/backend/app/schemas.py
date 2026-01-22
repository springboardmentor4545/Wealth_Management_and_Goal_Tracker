from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Union
from enum import Enum
from datetime import date, datetime

class RiskProfileEnum(str, Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"

class KYCStatusEnum(str, Enum):
    verified = "verified"
    unverified = "unverified"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    risk_profile: RiskProfileEnum
    kyc_status: KYCStatusEnum
    profile_completed: bool

    class Config:
        from_attributes = True

class RiskProfileSubmit(BaseModel):
    answers: Dict[Union[int, str], int]

class RiskProfileOut(BaseModel):
    risk_profile: RiskProfileEnum
    kyc_status: KYCStatusEnum
    profile_completed: bool

class GoalTypeEnum(str, Enum):
    retirement = "retirement"
    home = "home"
    education = "education"
    custom = "custom"


class GoalStatusEnum(str, Enum):
    active = "active"
    paused = "paused"
    completed = "completed"


class GoalCreate(BaseModel):
    goal_type: GoalTypeEnum
    target_amount: float
    target_date: date
    monthly_contribution: float
    status: GoalStatusEnum = GoalStatusEnum.active

class GoalUpdate(BaseModel):
    goal_type: Optional[GoalTypeEnum]
    target_amount: Optional[float]
    target_date: Optional[date]
    monthly_contribution: Optional[float]
    status: Optional[GoalStatusEnum]


class GoalOut(BaseModel):
    id: int
    goal_type: GoalTypeEnum
    target_amount: float
    target_date: date
    monthly_contribution: float
    months_remaining: int
    invested_so_far: float
    progress_percentage: float
    status: GoalStatusEnum

    class Config:
        from_attributes = True


class AssetTypeEnum(str, Enum):
    stock = "stock"
    etf = "etf"
    mutual_fund = "mutual_fund"
    bond = "bond"
    cash = "cash"


class TransactionTypeEnum(str, Enum):
    buy = "buy"
    sell = "sell"


class TransactionCreate(BaseModel):
    symbol: str
    asset_type: AssetTypeEnum
    type: TransactionTypeEnum
    quantity: float
    price: float
    fees: float = 0
    executed_at: Optional[datetime] = None 


class TransactionOut(BaseModel):
    id: int
    symbol: str
    type: TransactionTypeEnum
    quantity: float
    price: float
    fees: float
    executed_at: datetime

    class Config:
        from_attributes = True


class InvestmentOut(BaseModel):
    id: int
    symbol: str
    asset_type: AssetTypeEnum
    units: float
    avg_buy_price: float
    cost_basis: float
    current_value: float
    last_price: float
    last_price_at: Optional[datetime]
    
    class Config:
        from_attributes = True