from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    email = Column(String, unique=True)
    password_hash = Column(String)
    risk_score = Column(Integer, default=0)      # ✅ Add this
    risk_level = Column(String, default="Unknown")  # ✅ Add this
    profile_completed = Column(Boolean, default=False)
    # ... other fields
