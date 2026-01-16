from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    risk_score = Column(Integer, default=0)
    risk_category = Column(String, default="unknown")
    profile_notes = Column(Text, nullable=True)
    kyc_status = Column(String, default="unverified")
    profile_completed = Column(Boolean, default=False)
    allocation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to Goals (One-to-Many)
    # goals = relationship("Goal", back_populates="user") # We can add this if needed, but for now we just need the ForeignKey in Goal


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True) # ForeignKey constraint can be added: ForeignKey("users.id")
    title = Column(String, nullable=False)
    target_amount = Column(Integer, nullable=False)
    target_date = Column(DateTime(timezone=True), nullable=False)
    monthly_contribution = Column(Integer, default=0)
    current_amount = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    symbol = Column(String, nullable=False, index=True) # e.g. "AAPL", "BTC"
    asset_type = Column(String, default="Stock") # Stock, Crypto, Bond
    quantity = Column(Float, default=0.0)
    average_buy_price = Column(Float, default=0.0)
    # current_price = Column(Float) # In a real app, this would come from a live API
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    symbol = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False) # "BUY" or "SELL"
    quantity = Column(Float, nullable=False)
    price_per_unit = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())

