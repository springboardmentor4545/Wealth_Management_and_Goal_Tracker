# backend/app/schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal

from .models import RiskProfileEnum, KycStatusEnum

# =====================================================
# USERS
# =====================================================

class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    risk_profile: Optional[RiskProfileEnum]
    kyc_status: KycStatusEnum
    profile_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdateRequest(BaseModel):
    risk_profile: Optional[RiskProfileEnum] = None
    kyc_status: Optional[KycStatusEnum] = None


# =====================================================
# GOALS
# =====================================================

class GoalCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    target_amount: Decimal
    monthly_contribution: Decimal
    start_date: date
    deadline: Optional[date] = None


class GoalUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    target_amount: Optional[Decimal] = None
    monthly_contribution: Optional[Decimal] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None


class GoalResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    target_amount: Decimal
    monthly_contribution: Decimal
    start_date: date
    deadline: Optional[date]
    invested_amount: Decimal
    remaining_amount: Decimal
    duration_months: int
    progress_percent: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# PORTFOLIO
# =====================================================

class TransactionCreateRequest(BaseModel):
    asset_name: str
    asset_type: str
    transaction_type: str
    quantity: Decimal
    price: Decimal


class InvestmentResponse(BaseModel):

    id: int
    asset_name: str
    asset_type: str
    symbol: Optional[str] = None
    total_quantity: Decimal
    average_price: Decimal
    last_price: Optional[Decimal] = None
    last_price_updated_at: Optional[datetime] = None
    current_value: Optional[Decimal] = None
    # Derived fields
    units_held: Decimal
    cost_basis: Decimal
    average_buy_price: Decimal
    day_change: Optional[Decimal] = None

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: int
    transaction_type: str
    quantity: Decimal
    price: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# PORTFOLIO SUMMARY  ✅ THIS FIXES YOUR LAST ERROR
# =====================================================

class PortfolioSummaryResponse(BaseModel):
    total_value: Decimal
    last_price_updated_at: Optional[datetime]


# =====================================================
# SIMULATIONS
# =====================================================

class SimulationAssumptions(BaseModel):
    expected_return: Decimal
    inflation: Decimal
    time_horizon_years: int
    initial_investment: Decimal
    monthly_contribution: Decimal
    target_amount: Decimal


class SimulationCreateRequest(BaseModel):
    assumptions: SimulationAssumptions


class SimulationResponse(BaseModel):
    id: int
    assumptions: Dict[str, Any]
    results: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
