from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    Boolean,
    Date,
    Float,
    ForeignKey,
    DateTime,
    Numeric,
    JSON,
    Text
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from datetime import datetime
from .database import Base



# ENUMS

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



# USER MODEL

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

    risk_profile = Column(
        Enum(RiskProfileEnum),
        default=RiskProfileEnum.conservative,
        nullable=False
    )

    kyc_status = Column(
        Enum(KYCStatusEnum),
        default=KYCStatusEnum.unverified,
        nullable=False
    )

    profile_completed = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

   
    goals = relationship(
        "Goal",
        back_populates="user",
        cascade="all, delete"
    )

    simulations = relationship(
        "Simulation",
        back_populates="user",
        cascade="all, delete"
    )

    investments = relationship(
        "Investment",
        back_populates="user",
        cascade="all, delete"
    )

    transactions = relationship(
        "Transaction",
        back_populates="user",
        cascade="all, delete"
    )



# GOALS MODEL

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    goal_type = Column(Enum(GoalTypeEnum), nullable=False)
    target_amount = Column(Float, nullable=False)
    target_date = Column(Date, nullable=False)
    monthly_contribution = Column(Float, nullable=False)

    status = Column(
        Enum(GoalStatusEnum),
        default=GoalStatusEnum.active,
        nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")

    simulations = relationship(
        "Simulation",
        back_populates="goal",
        cascade="all, delete"
    )



# INVESTMENTS MODEL

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    asset_type = Column(Enum(AssetTypeEnum), nullable=False)
    symbol = Column(String(50), index=True, nullable=False)

    units = Column(Numeric, default=0)
    avg_buy_price = Column(Numeric, default=0)
    cost_basis = Column(Numeric, default=0)

    last_price = Column(Numeric)
    last_price_updated_at = Column(DateTime)

    current_value = Column(Numeric, default=0)

    user = relationship("User", back_populates="investments")



# TRANSACTIONS MODEL

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    symbol = Column(String(50), nullable=False)
    type = Column(Enum(TransactionTypeEnum), nullable=False)

    quantity = Column(Numeric, nullable=False)
    price = Column(Numeric, nullable=False)
    fees = Column(Numeric, default=0)

    executed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")



# SIMULATIONS MODEL

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True)

    scenario_name = Column(String(150), nullable=False)

    assumptions = Column(JSONB, nullable=False)
    results = Column(JSONB, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="simulations")
    goal = relationship("Goal", back_populates="simulations")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String, nullable=False)
    recommendation_text = Column(Text, nullable=False)

    suggested_allocation = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
