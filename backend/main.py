from fastapi import FastAPI, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, ForeignKey, Date, Numeric
import enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from jose import JWTError, jwt
from datetime import datetime, timedelta, date
from pydantic import BaseModel
from typing import Optional, List, Dict
import hashlib
import uvicorn
from app.services.market_data import fetch_latest_price, search_symbols, update_all_investment_prices_logic
import os
import math
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# ENUM definitions for the database
class RiskProfileType(enum.Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"

class KYCStatusType(enum.Enum):
    unverified = "unverified"
    verified = "verified"

class GoalType(enum.Enum):
    retirement = "retirement"
    home = "home"
    education = "education"
    custom = "custom"

class GoalStatus(enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"

class AssetType(enum.Enum):
    stock = "stock"
    etf = "etf"
    mutual_fund = "mutual_fund"
    bond = "bond"
    cash = "cash"

class TransactionType(enum.Enum):
    buy = "buy"
    sell = "sell"
    dividend = "dividend"
    contribution = "contribution"
    withdrawal = "withdrawal"

# Database configuration
# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    name = Column(String(100))
    email = Column(String(120), unique=True, index=True)
    risk_profile = Column(SQLEnum(RiskProfileType), nullable=True)
    kyc_status = Column(SQLEnum(KYCStatusType), default=KYCStatusType.unverified)
    created_at = Column(DateTime, default=datetime.utcnow)

    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")

class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    goal_type = Column(SQLEnum(GoalType), nullable=False)
    target_amount = Column(Numeric(15, 2), nullable=False)
    target_date = Column(Date, nullable=False)
    monthly_contribution = Column(Numeric(10, 2), nullable=False)
    status = Column(SQLEnum(GoalStatus), default=GoalStatus.active)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")

class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    asset_type = Column(SQLEnum(AssetType), nullable=False)
    symbol = Column(String(50), nullable=False)
    units = Column(Numeric(15, 6), default=0)
    avg_buy_price = Column(Numeric(10, 2), default=0)
    cost_basis = Column(Numeric(15, 2), default=0)
    current_value = Column(Numeric(15, 2), default=0)
    last_price = Column(Numeric(10, 2), nullable=True)
    last_price_at = Column(DateTime, nullable=True)
    daily_change = Column(Numeric(10, 2), default=0)

    user = relationship("User", back_populates="investments")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    symbol = Column(String(50), nullable=False)
    type = Column(SQLEnum(TransactionType), nullable=False)
    quantity = Column(Numeric(15, 6), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    fees = Column(Numeric(10, 2), default=0)
    executed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")

from sqlalchemy.dialects.postgresql import JSONB

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    recommendation_text = Column(String, nullable=False)
    suggested_allocation = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class Simulation(Base):
    __tablename__ = "simulations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    scenario_name = Column(String(100), nullable=False)
    assumptions = Column(JSONB, nullable=False)
    results = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    goal = relationship("Goal")

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# FastAPI app
app = FastAPI(title="Wealth Tracker API")

# CORS middleware - IMPORTANT: Add your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")) 

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# Pydantic Models
class UserBase(BaseModel):
    username: str
    email: str
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class RiskQuestionResponse(BaseModel):
    question_id: int
    answer: int

class RiskProfileRequest(BaseModel):
    answers: Dict[int, int]  # question_id: answer

class GoalBase(BaseModel):
    goal_type: GoalType
    target_amount: float
    target_date: date
    monthly_contribution: float
    status: Optional[GoalStatus] = GoalStatus.active

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    goal_type: Optional[GoalType] = None
    target_amount: Optional[float] = None
    target_date: Optional[date] = None
    monthly_contribution: Optional[float] = None
    status: Optional[GoalStatus] = None

class GoalResponse(GoalBase):
    id: int
    user_id: int
    created_at: datetime
    
    # Financial Logic fields
    duration_months: int
    total_invested: float
    remaining_amount: float
    progress_percentage: float

# Portfolio Schemas
class TransactionBase(BaseModel):
    symbol: str
    type: TransactionType
    quantity: float
    price: float
    fees: float = 0

class TransactionCreate(TransactionBase):
    asset_type: AssetType # Needed for new investments

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    executed_at: datetime

    class Config:
        orm_mode = True

class InvestmentResponse(BaseModel):
    id: int
    user_id: int
    asset_type: AssetType
    symbol: str
    units: float
    avg_buy_price: float
    cost_basis: float
    current_value: float
    last_price: Optional[float]
    last_price_at: Optional[datetime]
    daily_change: Optional[float]

    class Config:
        orm_mode = True

# Simulation Schemas
class SimulationBase(BaseModel):
    scenario_name: str
    goal_id: Optional[int] = None
    assumptions: Dict[str, float]

class SimulationCreate(SimulationBase):
    pass

class SimulationResponse(SimulationBase):
    id: int
    user_id: int
    results: Dict[str, float]
    created_at: datetime

    class Config:
        orm_mode = True

# Recommendation Schemas
class RecommendationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    recommendation_text: str
    suggested_allocation: Optional[Dict[str, float]]
    created_at: datetime

    class Config:
        orm_mode = True

# Risk questions
RISK_QUESTIONS = [
    {"id": 1, "question": "What is your investment time horizon?", 
     "options": [{"text": "1-5 years", "score": 1}, {"text": "5-10 years", "score": 2}, 
                 {"text": "10-20 years", "score": 3}, {"text": "20+ years", "score": 4}, 
                 {"text": "Unsure", "score": 0}]},
    {"id": 2, "question": "What is your primary investment goal?", 
     "options": [{"text": "Capital Growth", "score": 3}, {"text": "Income", "score": 2}, 
                 {"text": "Preservation", "score": 1}, {"text": "Diversification", "score": 2}, 
                 {"text": "Other", "score": 0}]},
    {"id": 3, "question": "How would you react to a 20% market decline?", 
     "options": [{"text": "Panic and sell", "score": 1}, {"text": "Sell some", "score": 2}, 
                 {"text": "Hold", "score": 3}, {"text": "Buy more", "score": 4}, 
                 {"text": "Not sure", "score": 0}]},
    {"id": 4, "question": "What percentage of your income do you invest?", 
     "options": [{"text": "Less than 5%", "score": 1}, {"text": "5-10%", "score": 2}, 
                 {"text": "10-20%", "score": 3}, {"text": "20-50%", "score": 4}, 
                 {"text": "Not sure", "score": 0}]},
    {"id": 5, "question": "How familiar are you with financial markets?", 
     "options": [{"text": "Very unfamiliar", "score": 1}, {"text": "Unfamiliar", "score": 2}, 
                 {"text": "Moderately familiar", "score": 3}, {"text": "Familiar", "score": 4}, 
                 {"text": "Very familiar", "score": 5}]},
    {"id": 6, "question": "What is your acceptable loss tolerance?", 
     "options": [{"text": "Cannot accept any loss", "score": 1}, {"text": "Small loss only", "score": 2}, 
                 {"text": "Moderate loss", "score": 3}, {"text": "Significant loss", "score": 4}, 
                 {"text": "Large loss", "score": 5}]},
    {"id": 7, "question": "How do you manage emergency funds?", 
     "options": [{"text": "No emergency fund", "score": 1}, {"text": "1-3 months", "score": 2}, 
                 {"text": "3-6 months", "score": 3}, {"text": "6-12 months", "score": 4}, 
                 {"text": "12+ months", "score": 5}]}
]

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_risk_level(score: int) -> RiskProfileType:
    if score <= 10:
        return RiskProfileType.conservative
    elif score <= 18:
        return RiskProfileType.moderate
    else:
        return RiskProfileType.aggressive

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Debug: Print first 5 chars of secret key to verify it matches
        print(f"DEBUG: Using SECRET_KEY starting with: {SECRET_KEY[:5]}...")
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={
                "verify_aud": False,
                "verify_iss": False
            }
        )
        username = payload.get("sub")
        if username is None:
            print("DEBUG: No 'sub' in token payload")
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as e:
        print(f"DEBUG: JWT ERROR: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

# Simulation Logic
def calculate_simulation(assumptions: dict) -> dict:
    """
    Calculate future value and shortfall/surplus based on assumptions.
    assumptions: {
        'initial_amount': float,
        'monthly_contribution': float,
        'expected_return': float (annual %),
        'inflation': float (annual %),
        'time_horizon': int (years),
        'target_amount': float (optional)
    }
    """
    initial = assumptions.get('initial_amount', 0)
    monthly = assumptions.get('monthly_contribution', 0)
    ret_rate_pct = assumptions.get('expected_return', 0)
    inf_rate_pct = assumptions.get('inflation', 0)
    years = int(assumptions.get('time_horizon', 10))
    target = assumptions.get('target_amount', 0)

    # 1. Total Invested = Monthly Investment * 12 * Years + Initial Amount
    # (Attributes initial amount to total invested as well)
    total_invested = initial + (monthly * 12 * years)

    # 2. Future Value = Total Invested * (1 + Expected Return/100)
    # The user's formula implies a simple growth factor on the total sum. 
    # To keep it slightly realistic for the initial amount, we might want to apply it to the whole.
    # Based strictly on "Total Invested * (1 + Expected Return/100)"
    fv = total_invested * (1 + (ret_rate_pct / 100))

    # 3. Inflation Adjusted Value = Future Value / (1 + Inflation/100) ^ Years
    fv_real = fv / ((1 + (inf_rate_pct / 100)) ** years)

    shortfall_or_surplus = fv - target if target > 0 else 0

    return {
        "future_value": round(fv, 2),
        "future_value_real": round(fv_real, 2),
        "total_invested": round(total_invested, 2),
        "shortfall_or_surplus": round(shortfall_or_surplus, 2),
        "target_amount": target
    }


# Endpoints
@app.post("/api/v1/auth/register")
async def register_user(
    email: str = Form(...),
    password: str = Form(...),
    name: str = Form(default=""),
    username: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Register new user"""
    # Use email prefix as username if not provided
    if not username:
        username = email.split('@')[0]
    
    # Password Complexity Validation
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    import re
    if not (re.search(r"[A-Z]", password) and 
            re.search(r"[a-z]", password) and 
            re.search(r"\d", password) and 
            re.search(r"[!@#$%^&*(),.?\":{}|<>]", password)):
        raise HTTPException(
            status_code=400, 
            detail="Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol"
        )

    print(f"Registration attempt: {username}, {email}")  # Debug log
    
    # Check if user exists
    existing = db.query(User).filter((User.email == email) | (User.username == username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    new_user = User(
        username=username,
        email=email,
        name=name or username,
        hashed_password=hash_password(password),
        kyc_status=KYCStatusType.unverified,
        risk_profile=None
    )
    
    try:
        # Save to database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"User created: {new_user.id}")  # Debug log
    except Exception as e:
        db.rollback()
        print(f"Database error: {e}")  # Debug log
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {
        "message": "User registered successfully",
        "username": new_user.username,
        "email": new_user.email,
        "id": new_user.id
    }

@app.post("/api/v1/auth/login")
async def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Login user"""
    print(f"Login attempt: {username}")  # Debug log
    
    # Allow login with either username or email
    user = db.query(User).filter((User.username == username) | (User.email == username)).first()
    if not user:
        print(f"Login failed: User {username} not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": username}, expires_delta=access_token_expires)
    
    refresh_token_expires = timedelta(days=7)
    refresh_token = create_access_token(data={"sub": username, "type": "refresh"}, expires_delta=refresh_token_expires)
    
    print(f"Login successful: {username}")  # Debug log
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
        "profile_completed": user.risk_profile is not None,
        "kyc_status": user.kyc_status.value if hasattr(user.kyc_status, 'value') else user.kyc_status,
        "username": user.username,
        "name": user.name,
        "email": user.email
    }

@app.get("/api/v1/auth/risk-profile/questions")
async def get_risk_questions():
    """Get all risk profiling questions"""
    return RISK_QUESTIONS

@app.post("/api/v1/auth/risk-profile/submit")
async def submit_risk_profile(
    answers: RiskProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit risk profile"""
    total_score = 0
    for q_id, answer in answers.answers.items():
        total_score += answer
    
    risk_level = get_risk_level(total_score)
    
    # Update user
    current_user.risk_profile = risk_level
    db.commit()
    
    return {
        "risk_level": risk_level.value,
        "message": "Risk profile submitted"
    }

@app.post("/api/v1/auth/kyc/submit")
async def submit_kyc(
    name: str = Form(...),
    pan: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit KYC"""
    current_user.kyc_status = KYCStatusType.verified
    db.commit()
    return {"message": "KYC submitted and verified"}

@app.post("/api/v1/auth/kyc/verify")
async def verify_kyc(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify KYC"""
    current_user.kyc_status = KYCStatusType.verified
    db.commit()
    return {"message": "KYC verified"}

@app.get("/api/v1/auth/profile/status")
async def get_profile_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get profile status"""
    return {
        "profile_completed": current_user.risk_profile is not None,
        "kyc_status": current_user.kyc_status.value if hasattr(current_user.kyc_status, 'value') else current_user.kyc_status,
        "risk_profile": current_user.risk_profile.value if current_user.risk_profile else None
    }

# Goals Endpoints
@app.post("/api/v1/goals", response_model=GoalResponse)
async def create_goal(
    goal: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new goal"""
    db_goal = Goal(
        **goal.dict(),
        user_id=current_user.id
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return calculate_goal_metrics(db_goal)

@app.get("/api/v1/goals", response_model=List[GoalResponse])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all goals for current user"""
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    return [calculate_goal_metrics(g) for g in goals]

@app.put("/api/v1/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a goal"""
    db_goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_data = goal_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_goal, key, value)
    
    db.commit()
    db.refresh(db_goal)
    return calculate_goal_metrics(db_goal)

@app.delete("/api/v1/goals/{goal_id}")
async def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a goal"""
    db_goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    db.delete(db_goal)
    db.commit()
    return {"message": "Goal deleted successfully"}

# Portfolio Endpoints
@app.post("/api/v1/portfolio/transactions", response_model=TransactionResponse)
async def create_transaction(
    tx: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a new transaction and update investments"""
    # 1. Check if investment exists
    inv = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.symbol == tx.symbol.upper()
    ).first()

    quantity = float(tx.quantity)
    price = float(tx.price)
    fees = float(tx.fees)

    if tx.type == TransactionType.sell:
        if not inv or float(inv.units) < quantity:
            raise HTTPException(status_code=400, detail="Insufficient units to sell")
        
        # Update investment for Sell
        inv.units = float(inv.units) - quantity
        
        # Floating point safety check (epsilon)
        if inv.units < 1e-8:
            inv.units = 0
            inv.cost_basis = 0
            inv.avg_buy_price = 0
            inv.current_value = 0
            inv.last_price = price
            inv.last_price_at = datetime.utcnow()
        else:
            # Cost basis reduction (simplified: proportional to units)
            inv.cost_basis = float(inv.units) * float(inv.avg_buy_price)
            # We don't update last_price on sell here anymore, 
            # as the block below handles live fetch or fallback
        
    elif tx.type == TransactionType.buy:
        if not inv:
            inv = Investment(
                user_id=current_user.id,
                symbol=tx.symbol.upper(),
                asset_type=tx.asset_type,
                units=0,
                avg_buy_price=0,
                cost_basis=0,
                current_value=0
            )
            db.add(inv)
        
        # Update investment for Buy
        new_units = float(inv.units) + quantity
        new_cost_basis = float(inv.cost_basis) + (quantity * price) + fees
        inv.units = new_units
        inv.cost_basis = new_cost_basis
        inv.avg_buy_price = new_cost_basis / new_units if new_units > 0 else 0
        # We don't update last_price here anymore, 
        # as the block below handles live fetch or fallback

    # 2. Record transaction
    db_tx = Transaction(
        user_id=current_user.id,
        symbol=tx.symbol.upper(),
        type=tx.type,
        quantity=quantity,
        price=price,
        fees=fees
    )
    db.add(db_tx)

    # 3. Update investment with LIVE price if available
    # Only if units > 0
    if inv.units > 0:
        live_p, live_t = fetch_latest_price(tx.symbol.upper())
        if live_p is not None:
            inv.last_price = live_p
            inv.last_price_at = live_t
            inv.current_value = float(inv.units) * live_p
        else:
            # Fallback to last known or transaction price logic can go here if needed
            pass
    
    try:
        # Sanitize NaN values before committing or returning
        if inv.last_price is not None and math.isnan(float(inv.last_price)):
            inv.last_price = None
        if inv.current_value is not None and math.isnan(float(inv.current_value)):
            inv.current_value = 0
            
        db.commit()
        db.refresh(db_tx)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    return db_tx

@app.get("/api/v1/portfolio/transactions", response_model=List[TransactionResponse])
async def list_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all transactions for current user"""
    return db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.executed_at.desc()).all()

@app.get("/api/v1/portfolio/investments", response_model=List[InvestmentResponse])
async def list_investments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all units held for current user"""
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    # Ensure numerical types are float for Pydantic and handle NaN
    for inv in investments:
        inv.units = float(inv.units)
        inv.avg_buy_price = float(inv.avg_buy_price)
        inv.cost_basis = float(inv.cost_basis)
        inv.current_value = float(inv.current_value)
        if inv.last_price is not None: 
            inv.last_price = float(inv.last_price)
            if math.isnan(inv.last_price):
                inv.last_price = None
        
        # Final safety check for current_value
        if math.isnan(inv.current_value):
            inv.current_value = 0.0
            
    return investments

@app.post("/api/v1/portfolio/update-prices")
async def trigger_price_update(db: Session = Depends(get_db)):
    """Manual trigger for price updates (synchronous for immediate results)"""
    result = update_all_investment_prices_logic(SessionLocal, Investment)
    return {"message": "Price update completed", "detail": result}

@app.get("/api/v1/portfolio/last-refresh")
async def get_last_price_refresh(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the timestamp of the last price refresh for the current user's investments"""
    try:
        # Get the most recent last_price_at timestamp from user's investments
        latest_refresh = db.query(Investment).filter(
            Investment.user_id == current_user.id,
            Investment.last_price_at.isnot(None)
        ).order_by(Investment.last_price_at.desc()).first()
        
        if latest_refresh and latest_refresh.last_price_at:
            return {
                "last_refresh_at": latest_refresh.last_price_at,
                "next_scheduled_refresh": "16:00 IST (Every Day)"
            }
        else:
            return {
                "last_refresh_at": None,
                "next_scheduled_refresh": "16:00 IST (Every Day)",
                "message": "No price data available yet"
            }
    except Exception as e:
        logger.error(f"Error fetching last refresh time: {e}")
        raise HTTPException(status_code=500, detail="Error fetching refresh information")

# Simulation Endpoints
@app.post("/api/v1/simulations", response_model=SimulationResponse)
async def create_simulation(
    simulation: SimulationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new simulation and calculate results"""
    results = calculate_simulation(simulation.assumptions)
    db_sim = Simulation(
        user_id=current_user.id,
        goal_id=simulation.goal_id,
        scenario_name=simulation.scenario_name,
        assumptions=simulation.assumptions,
        results=results
    )
    db.add(db_sim)
    db.commit()
    db.refresh(db_sim)
    return db_sim

@app.get("/api/v1/simulations", response_model=List[SimulationResponse])
async def list_simulations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all simulations for the current user"""
    return db.query(Simulation).filter(Simulation.user_id == current_user.id).order_by(Simulation.created_at.desc()).all()

@app.get("/api/v1/simulations/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(
    simulation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get simulation details"""
    sim = db.query(Simulation).filter(Simulation.id == simulation_id, Simulation.user_id == current_user.id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim

# Recommendation Endpoints
@app.get("/api/v1/recommendations/status")
async def get_recommendations_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current allocation and recommendations based on user's risk profile"""
    
    # Calculate current allocation
    investments = db.query(Investment).filter(Investment.user_id == current_user.id).all()
    total_value = sum(float(inv.current_value) for inv in investments)
    
    current_allocation = {
        "stock": 0,
        "etf": 0,
        "mutual_fund": 0,
        "bond": 0,
        "cash": 0
    }
    
    if total_value > 0:
        for inv in investments:
            asset_type = inv.asset_type.value
            if asset_type in current_allocation:
                current_allocation[asset_type] += float(inv.current_value) / total_value * 100
    
    # Define target allocations based on risk profile
    target_allocations = {
        "conservative": {
            "stock": 20,
            "etf": 10,
            "mutual_fund": 20,
            "bond": 40,
            "cash": 10
        },
        "moderate": {
            "stock": 35,
            "etf": 15,
            "mutual_fund": 20,
            "bond": 20,
            "cash": 10
        },
        "aggressive": {
            "stock": 50,
            "etf": 20,
            "mutual_fund": 15,
            "bond": 10,
            "cash": 5
        }
    }
    
    risk_profile = current_user.risk_profile.value if current_user.risk_profile else "moderate"
    target_allocation = target_allocations.get(risk_profile, target_allocations["moderate"])
    
    # Generate rebalancing suggestions
    asset_categories = {
        "stock": "Equities",
        "etf": "ETFs",
        "mutual_fund": "Mutual Funds",
        "bond": "Bonds",
        "cash": "Cash"
    }
    
    suggestions = []
    for asset_type, target_pct in target_allocation.items():
        current_pct = round(current_allocation.get(asset_type, 0), 2)
        difference = round(target_pct - current_pct, 2)
        
        # Determine action
        if abs(difference) < 2:
            action = "Maintain"
            message = f"Your {asset_categories[asset_type]} allocation is well-balanced at {current_pct}%."
        elif difference > 0:
            action = "Increase"
            message = f"Consider increasing {asset_categories[asset_type]} allocation to {target_pct}% for better risk alignment."
        else:
            action = "Reduce"
            message = f"Consider reducing {asset_categories[asset_type]} allocation from {current_pct}% to {target_pct}%."
        
        suggestions.append({
            "category": asset_categories[asset_type],
            "action": action,
            "difference": difference,
            "message": message,
            "current_pct": round(current_pct, 1),
            "target_pct": round(target_pct, 1)
        })
    
    return {
        "current_allocation": current_allocation,
        "target_allocation": target_allocation,
        "risk_profile": risk_profile,
        "total_value": total_value,
        "suggestions": suggestions
    }

@app.get("/api/v1/recommendations", response_model=List[RecommendationResponse])
async def list_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all recommendations for the current user"""
    return db.query(Recommendation).filter(Recommendation.user_id == current_user.id).order_by(Recommendation.created_at.desc()).all()

@app.get("/api/v1/portfolio/search")
async def search_stock_symbols(q: str, current_user: User = Depends(get_current_user)):
    """Search for stock symbols"""
    return search_symbols(q)

def calculate_goal_metrics(g: Goal) -> dict:
    """Helper to calculate financial metrics for a goal"""
    # Duration in months from creation to target date
    # Handle cases where created_at might be None (newly created object before commit/refresh)
    start_date = g.created_at.date() if g.created_at else date.today()
    end_date = g.target_date
    duration_months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
    if duration_months <= 0: duration_months = 1
    
    # Months passed since creation
    today = date.today()
    months_passed = (today.year - start_date.year) * 12 + (today.month - start_date.month)
    if months_passed < 0: months_passed = 0
    
    total_invested = float(g.monthly_contribution) * months_passed
    # Cap total invested at target amount
    if total_invested > float(g.target_amount):
        total_invested = float(g.target_amount)
        
    remaining_amount = float(g.target_amount) - total_invested
    progress_percentage = (total_invested / float(g.target_amount)) * 100 if float(g.target_amount) > 0 else 0
    
    return {
        "id": g.id,
        "user_id": g.user_id,
        "goal_type": g.goal_type,
        "target_amount": float(g.target_amount),
        "target_date": g.target_date,
        "monthly_contribution": float(g.monthly_contribution),
        "status": g.status,
        "created_at": g.created_at,
        "duration_months": duration_months,
        "total_invested": round(total_invested, 2),
        "remaining_amount": round(remaining_amount, 2),
        "progress_percentage": round(progress_percentage, 2)
    }

@app.get("/")
def root():
    return {"message": "Wealth Tracker API"}

@app.get("/api/v1/health")
def health():
    return {"status": "healthy"}

@app.get("/api/v1")
def api_health():
    return {"message": "Wealth Tracker API is running"}

# Add this to run directly
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)