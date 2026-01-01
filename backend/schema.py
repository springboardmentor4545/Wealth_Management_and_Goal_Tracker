from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime, date
from enum import Enum


# ================== ENUMS ==================

class RiskProfile(str, Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"


class KYCStatus(str, Enum):
    unverified = "unverified"
    verified = "verified"


class GoalType(str, Enum):
    retirement = "retirement"
    home = "home"
    education = "education"
    custom = "custom"


class GoalStatus(str, Enum):
    active = "active"
    paused = "paused"
    completed = "completed"


class AssetType(str, Enum):
    stock = "stock"
    etf = "etf"
    mutual_fund = "mutual_fund"
    bond = "bond"
    cash = "cash"


class TransactionType(str, Enum):
    buy = "buy"
    sell = "sell"
    dividend = "dividend"
    contribution = "contribution"
    withdrawal = "withdrawal"


# ================== USERS ==================

class UserBase(BaseModel):
    name: str
    email: EmailStr
    risk_profile: RiskProfile
    kyc_status: KYCStatus


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ================== GOALS ==================

class GoalBase(BaseModel):
    goal_type: GoalType
    target_amount: float
    target_date: date
    monthly_contribution: float
    status: GoalStatus


class GoalCreate(GoalBase):
    user_id: int


class GoalResponse(GoalBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ================== INVESTMENTS ==================

class InvestmentBase(BaseModel):
    asset_type: AssetType
    symbol: str
    units: float
    avg_buy_price: float
    cost_basis: float
    current_value: float
    last_price: float


class InvestmentCreate(InvestmentBase):
    user_id: int


class InvestmentResponse(InvestmentBase):
    id: int
    user_id: int
    last_price_at: datetime

    class Config:
        from_attributes = True


# ================== TRANSACTIONS ==================

class TransactionBase(BaseModel):
    symbol: str
    type: TransactionType
    quantity: float
    price: float
    fees: float


class TransactionCreate(TransactionBase):
    user_id: int


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    executed_at: datetime

    class Config:
        from_attributes = True


# ================== RECOMMENDATIONS ==================

class RecommendationBase(BaseModel):
    title: str
    recommendation_text: str
    suggested_allocation: Dict


class RecommendationCreate(RecommendationBase):
    user_id: int


class RecommendationResponse(RecommendationBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ================== SIMULATIONS ==================

class SimulationBase(BaseModel):
    scenario_name: str
    assumptions: Dict
    results: Dict


class SimulationCreate(SimulationBase):
    user_id: int
    goal_id: Optional[int]


class SimulationResponse(SimulationBase):
    id: int
    user_id: int
    goal_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
