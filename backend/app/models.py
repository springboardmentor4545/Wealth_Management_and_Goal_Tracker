# backend/app/models.py
from sqlalchemy import (
    Column, Integer, String, DateTime, Date, ForeignKey,
    Numeric, Enum, Boolean, Index, JSON
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from .database import Base


# ================= ENUMS =================
class RiskProfileEnum(str, enum.Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"


class KycStatusEnum(str, enum.Enum):
    unverified = "unverified"
    verified = "verified"


class TransactionTypeEnum(str, enum.Enum):
    buy = "buy"
    sell = "sell"


# ================= USERS =================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    risk_profile = Column(Enum(RiskProfileEnum), nullable=True)
    kyc_status = Column(Enum(KycStatusEnum), default=KycStatusEnum.unverified)
    profile_completed = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    investments = relationship(
        "Investment",
        back_populates="user",
        cascade="all, delete"
    )
    goals = relationship(
        "Goal",
        back_populates="user",
        cascade="all, delete"
    )


# ================= GOALS =================
class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active")
    target_amount = Column(Numeric(14, 2), nullable=False)
    monthly_contribution = Column(Numeric(14, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    deadline = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")


# ================= INVESTMENTS =================
class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    asset_name = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)
    symbol = Column(String, nullable=True)

    total_quantity = Column(Numeric(14, 2), default=0)
    average_price = Column(Numeric(14, 2), default=0)

    last_price = Column(Numeric(14, 2), nullable=True)
    last_price_updated_at = Column(DateTime, nullable=True)
    current_value = Column(Numeric(16, 2), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="investments")
    transactions = relationship(
        "Transaction",
        back_populates="investment",
        cascade="all, delete"
    )

    __table_args__ = (
        Index("ix_user_asset", "user_id", "asset_name", "asset_type", unique=True),
    )


# ================= TRANSACTIONS =================
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    investment_id = Column(Integer, ForeignKey("investments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    transaction_type = Column(Enum(TransactionTypeEnum), nullable=False)
    quantity = Column(Numeric(14, 2), nullable=False)
    price = Column(Numeric(14, 2), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    investment = relationship("Investment", back_populates="transactions")


# ================= SIMULATIONS =================
class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    assumptions = Column(JSON, nullable=False)
    results = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
