from sqlalchemy import Column, Integer, String, Enum, Boolean, Date, Float, ForeignKey, DateTime, Numeric
from enum import Enum as PyEnum
from .database import Base
from sqlalchemy.orm import relationship
from datetime import datetime


class RiskProfileEnum(str, PyEnum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"


class KYCStatusEnum(str, PyEnum):
    verified = "verified"
    unverified = "unverified"


class GoalTypeEnum(str, PyEnum):
    retirement = "retirement"
    home = "home"
    education = "education"
    custom = "custom"


class GoalStatusEnum(str, PyEnum):
    active = "active"
    paused = "paused"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(150), unique=True, index=True)
    password = Column(String(255))

    risk_profile = Column(Enum(RiskProfileEnum), default=RiskProfileEnum.conservative)
    kyc_status = Column(Enum(KYCStatusEnum), default=KYCStatusEnum.unverified)
    profile_completed = Column(Boolean, default=False)

    goals = relationship("Goal", back_populates="user", cascade="all, delete")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    goal_type = Column(Enum(GoalTypeEnum), nullable=False)
    target_amount = Column(Float, nullable=False)
    target_date = Column(Date, nullable=False)
    monthly_contribution = Column(Float, nullable=False)

    status = Column(Enum(GoalStatusEnum), default=GoalStatusEnum.active)
    created_at = Column(Date, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")

class AssetTypeEnum(str, PyEnum):
    stock = "stock"
    etf = "etf"
    mutual_fund = "mutual_fund"
    bond = "bond"
    cash = "cash"


class TransactionTypeEnum(str, PyEnum):
    buy = "buy"
    sell = "sell"
    dividend = "dividend"
    contribution = "contribution"
    withdrawal = "withdrawal"


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    asset_type = Column(Enum(AssetTypeEnum))
    symbol = Column(String(50))

    units = Column(Numeric, default=0)
    avg_buy_price = Column(Numeric, default=0)
    cost_basis = Column(Numeric, default=0)

    current_value = Column(Numeric, default=0)
    last_price = Column(Numeric, default=0)
    last_price_at = Column(DateTime)

    user = relationship("User")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    symbol = Column(String(50))
    type = Column(Enum(TransactionTypeEnum))
    quantity = Column(Numeric)
    price = Column(Numeric)
    fees = Column(Numeric, default=0)

    executed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")