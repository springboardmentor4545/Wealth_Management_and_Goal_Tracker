from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
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
