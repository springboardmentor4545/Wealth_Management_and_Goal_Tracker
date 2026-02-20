from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Union, List, Any
from enum import Enum
from datetime import date, datetime



class ChangePassword(BaseModel):
    new_password: str
    confirm_password: str


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


class RiskProfileSubmit(BaseModel):
    answers: Dict[Union[int, str], int]


class RiskProfileOut(BaseModel):
    risk_profile: RiskProfileEnum
    kyc_status: KYCStatusEnum
    profile_completed: bool

    class Config:
        from_attributes = True



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
    goal_type: Optional[GoalTypeEnum] = None
    target_amount: Optional[float] = None
    target_date: Optional[date] = None
    monthly_contribution: Optional[float] = None
    status: Optional[GoalStatusEnum] = None


class GoalOut(BaseModel):
    id: int
    goal_type: GoalTypeEnum
    target_amount: float
    target_date: date
    monthly_contribution: float

    months_remaining: int
    invested_so_far: float
    required_monthly: float
    total_required: float
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
    dividend = "dividend"
    contribution = "contribution"
    withdrawal = "withdrawal"


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
    last_price_updated_at: Optional[datetime]
    profit_loss: float
    profit_loss_percent: float

    class Config:
        from_attributes = True




class SimulationAssumptions(BaseModel):
    expected_return: float
    inflation: float
    time_horizon_years: int
    monthly_contribution: float
    initial_investment: float = 0


class SimulationCreate(BaseModel):
    scenario_name: str
    goal_id: Optional[int] = None
    assumptions: SimulationAssumptions


class SimulationOut(BaseModel):
    id: int
    scenario_name: str
    goal_id: Optional[int]
    assumptions: Dict[str, Any]
    results: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationCreate(BaseModel):
    title: str
    recommendation_text: str
    suggested_allocation: Dict[str, float]


class RecommendationOut(BaseModel):
    id: int
    title: str
    recommendation_text: str
    suggested_allocation: Dict[str, float]
    created_at: datetime

    class Config:
        from_attributes = True
