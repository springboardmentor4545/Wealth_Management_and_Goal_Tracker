from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime, date


# ---------- USERS ----------

class UserBase(BaseModel):
    name: str
    email: EmailStr
    risk_profile: str
    kyc_status: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- GOALS ----------

class GoalBase(BaseModel):
    goal_type: str
    target_amount: float
    target_date: date
    monthly_contribution: float
    status: str

class GoalCreate(GoalBase):
    user_id: int

class GoalResponse(GoalBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- INVESTMENTS ----------

class InvestmentBase(BaseModel):
    asset_type: str
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


# ---------- TRANSACTIONS ----------

class TransactionBase(BaseModel):
    symbol: str
    type: str
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


# ---------- RECOMMENDATIONS ----------

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


# ---------- SIMULATIONS ----------

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
