from fastapi import FastAPI, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List, Dict
import hashlib
import uvicorn  # Add this for running

# Database configuration
DATABASE_URL = "postgresql://postgres:Thaanish22*@localhost/wealth_tracker"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    email = Column(String(120), unique=True, index=True)
    full_name = Column(String(100))
    hashed_password = Column(String(255))
    kyc_completed = Column(Boolean, default=False)
    kyc_status = Column(String(50), default="pending")
    profile_completed = Column(Boolean, default=False)
    risk_score = Column(Integer, nullable=True)
    risk_level = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration - CHANGE THIS IN PRODUCTION!
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# Pydantic Models
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None

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

def get_risk_level(score: int) -> str:
    if score <= 10:
        return "Conservative"
    elif score <= 18:
        return "Moderate"
    else:
        return "Aggressive"

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
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
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as e:
        print("JWT ERROR:", e)
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


# Endpoints
@app.post("/api/v1/auth/register")
async def register_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(default=""),
    db: Session = Depends(get_db)
):
    """Register new user"""
    print(f"Registration attempt: {username}, {email}")  # Debug log
    
    # Check if user exists
    existing = db.query(User).filter((User.email == email) | (User.username == username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    new_user = User(
        username=username,
        email=email,
        full_name=full_name or username,
        hashed_password=hash_password(password),
        kyc_completed=False,
        kyc_status="pending",
        profile_completed=False
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
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
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
        "profile_completed": user.profile_completed,
        "username": user.username,
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
    current_user.risk_score = total_score
    current_user.risk_level = risk_level
    current_user.profile_completed = True
    db.commit()
    
    return {
        "risk_level": risk_level,
        "score": total_score,
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
    current_user.kyc_status = "submitted"
    db.commit()
    return {"message": "KYC submitted"}

@app.post("/api/v1/auth/kyc/verify")
async def verify_kyc(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify KYC"""
    current_user.kyc_completed = True
    current_user.kyc_status = "verified"
    current_user.profile_completed = True
    db.commit()
    return {"message": "KYC verified"}

@app.get("/api/v1/auth/profile/status")
async def get_profile_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get profile status"""
    return {
        "profile_completed": current_user.profile_completed,
        "kyc_completed": current_user.kyc_completed,
        "kyc_status": current_user.kyc_status,
        "risk_level": current_user.risk_level,
        "risk_score": current_user.risk_score
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)