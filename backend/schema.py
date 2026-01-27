from pydantic import BaseModel, EmailStr, Field, field_validator
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
    travel = "travel"
    emergency = "emergency"
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


# ✅ SIGNUP - Only name, email, password required
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=72, description="Password must be 8-72 characters")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if len(v) > 72:  # bcrypt limit
            raise ValueError('Password must not exceed 72 characters')
        # Check for uppercase
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        # Check for lowercase
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        # Check for number
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        # Check for special character
        if not any(not c.isalnum() for c in v):
            raise ValueError('Password must contain at least one special character')
        return v


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    risk_profile: str
    kyc_status: str
    profile_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse  # ✅ Include user data in token response


# ================== RISK QUESTIONS ==================

class RiskOption(BaseModel):
    text: str
    score: int


class RiskQuestionResponse(BaseModel):
    question_id: int
    question: str
    options: list[RiskOption]


# ================== RISK ASSESSMENT ==================

class Answer(BaseModel):
    questionId: int
    score: int


class RiskAssessmentSubmit(BaseModel):
    answers: list[Answer]
    user_id: int
    kyc_status: str  # "verified" or "unverified"


# ================== GOALS ==================

class GoalBase(BaseModel):
    goal_type: GoalType
    target_amount: float
    target_date: date
    monthly_contribution: float
    status: GoalStatus = GoalStatus.active


class GoalCreate(BaseModel):
    goal_type: str
    target_amount: float
    target_date: date
    monthly_contribution: float


class GoalResponse(GoalBase):
    id: int
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