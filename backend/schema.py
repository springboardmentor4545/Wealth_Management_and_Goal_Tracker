from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, List, Any
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
    risk_profile: Optional[RiskProfile] = RiskProfile.moderate
    kyc_status: Optional[KYCStatus] = KYCStatus.unverified


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=16)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8 or len(v) > 16:
            raise ValueError("Password must be 8–16 characters")
        return v


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


# ================== RISK ASSESSMENT ==================

class RiskAnswer(BaseModel):
    questionId: int
    score: int


class RiskAssessmentSubmit(BaseModel):
    answers: List[RiskAnswer]
    user_id: int
    kyc_status: str


# ================== GOALS ==================

class GoalBase(BaseModel):
    goal_type: GoalType
    target_amount: float
    target_date: date
    monthly_contribution: float
    status: GoalStatus


class GoalCreate(GoalBase):
    user_id: Optional[int] = None


class GoalResponse(GoalBase):
    goal_id: int
    user_id: int
    created_at: datetime

    duration_months: int
    required_monthly_investment: float
    total_invested: float
    completion_percentage: float

    class Config:
        from_attributes = True


# ================== INVESTMENTS ==================

class InvestmentBase(BaseModel):
    asset_type: AssetType
    symbol: str
    units: float
    avg_buy_price: float
    cost_basis: float
    current_value: Optional[float] = None
    last_price: Optional[float] = None


class InvestmentCreate(InvestmentBase):
    user_id: int


class InvestmentResponse(InvestmentBase):
    id: int
    user_id: int
    last_price_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ================== TRANSACTIONS ==================

class TransactionBase(BaseModel):
    symbol: str
    type: TransactionType
    quantity: float
    price: float
    fees: float = 0


class TransactionCreate(TransactionBase):
    user_id: int


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    executed_at: datetime

    class Config:
        from_attributes = True


# ================== RECOMMENDATIONS (OLD – TEXT BASED) ==================

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
    assumptions: Dict[str, Any]


class SimulationCreate(SimulationBase):
    goal_id: Optional[int] = None


class SimulationUpdate(BaseModel):
    scenario_name: Optional[str] = None
    assumptions: Optional[Dict[str, Any]] = None


class SimulationResponse(SimulationBase):
    id: int
    user_id: int
    goal_id: Optional[int]
    results: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ================== WEEK 7 – REBALANCING & ALLOCATION ==================

class AllocationResponse(BaseModel):
    risk_profile: str
    recommended: Dict[str, float]   # equity / debt / cash
    current: Dict[str, float]
    total_value: float


class RebalanceSuggestion(BaseModel):
    category: str                   # equity / debt / cash
    action: str                     # increase / decrease
    difference_percent: float
    message: str


class RebalanceResponse(BaseModel):
    risk_profile: str
    recommended: Dict[str, float]
    current: Dict[str, float]
    suggestions: List[RebalanceSuggestion]
