from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# Configuration
SECRET_KEY = "test-secret-key-for-development-only"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Pydantic models with risk profiling and KYC
class RiskProfileQuestion(BaseModel):
    question_id: int
    question: str
    answer: int  # 1-5 scale

class RiskProfileRequest(BaseModel):
    answers: List[RiskProfileQuestion]
    total_score: Optional[int] = None

class RiskProfileResponse(BaseModel):
    risk_level: str  # Conservative, Moderate, Aggressive
    score: int
    profile_completed: bool

class KYCStatus(BaseModel):
    kyc_completed: bool
    kyc_status: str  # pending, verified, rejected
    profile_completed: bool
    risk_profile: Optional[RiskProfileResponse] = None

class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    kyc_completed: bool = False
    kyc_status: str = "pending"
    profile_completed: bool = False
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str
    disabled: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    username: Optional[str] = None

class RefreshToken(BaseModel):
    refresh_token: str

# In-memory database
fake_users_db = {}

# Router
router = APIRouter(tags=["authentication"])

# Helper functions
def get_password_hash(password: str) -> str:
    """Simple password hashing for development"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Simple password verification"""
    return pwd_context.verify(plain_password, hashed_password)

def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)
    return None

def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Endpoints
@router.post("/register", response_model=UserBase)
async def register_user(user: UserCreate):
    print(f"Register attempt for user: {user.username}")
    
    if user.username in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    try:
        hashed_password = get_password_hash(user.password)
        print(f"Password hashed successfully")
        
        user_dict = user.dict()
        user_dict["hashed_password"] = hashed_password
        user_dict["disabled"] = False
        user_dict["kyc_completed"] = False
        user_dict["kyc_status"] = "pending"
        user_dict["profile_completed"] = False
        user_dict["risk_score"] = None
        user_dict["risk_level"] = None
        
        fake_users_db[user.username] = user_dict
        print(f"User {user.username} added to database")
        
        # Remove sensitive data from response
        response_dict = user_dict.copy()
        del response_dict["hashed_password"]
        del response_dict["disabled"]
        
        print(f"? Registration successful for {user.username}")
        return response_dict
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"? Unexpected error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    print(f"Login attempt for user: {form_data.username}")
    
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"? Authentication successful")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    refresh_token_expires = timedelta(days=7)
    refresh_token = create_access_token(
        data={"sub": user.username, "type": "refresh"}, expires_delta=refresh_token_expires
    )
    
    print(f"? Tokens generated")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token
    }

@router.post("/refresh", response_model=Token)
async def refresh_access_token(refresh_token: RefreshToken):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(refresh_token.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if username is None or token_type != "refresh":
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    user = get_user(fake_users_db, username=username)
    if user is None:
        raise credentials_exception
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token.refresh_token
    }

@router.get("/me", response_model=UserBase)
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    return current_user

# Risk Profiling and KYC Endpoints
@router.get("/risk-profile/questions")
async def get_risk_questions():
    """Get risk profiling questions"""
    from backend.app.schemas.risk_profiling import RISK_QUESTIONS
    return [{"id": q.id, "question": q.question, "options": q.options} for q in RISK_QUESTIONS]

@router.post("/risk-profile/submit", response_model=RiskProfileResponse)
async def submit_risk_profile(
    profile_data: RiskProfileRequest,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Submit risk profile assessment"""
    from backend.app.schemas.risk_profiling import (
        calculate_total_score, 
        calculate_risk_level,
        validate_answers,
        RISK_QUESTIONS
    )
    
    # Convert answers to dict
    answers_dict = {q.question_id: q.answer for q in profile_data.answers}
    
    # Validate answers
    if not validate_answers(answers_dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid answers provided"
        )
    
    # Calculate score
    total_score = calculate_total_score(answers_dict)
    
    # Calculate risk level
    risk_result = calculate_risk_level(total_score)
    
    # Update user profile
    fake_users_db[current_user.username]["risk_score"] = total_score
    fake_users_db[current_user.username]["risk_level"] = risk_result.level
    fake_users_db[current_user.username]["profile_completed"] = True
    
    return RiskProfileResponse(
        risk_level=risk_result.level,
        score=total_score,
        profile_completed=True
    )

@router.post("/kyc/submit")
async def submit_kyc(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Submit KYC information"""
    # In a real application, you would collect actual KYC data
    # For demo, we'll just mark as pending
    
    fake_users_db[current_user.username]["kyc_status"] = "pending"
    
    return {
        "message": "KYC submission received",
        "status": "pending",
        "user_id": current_user.username,
        "profile_completed": fake_users_db[current_user.username]["profile_completed"]
    }

@router.post("/kyc/verify")
async def verify_kyc(
    verification_data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Verify KYC (admin endpoint - for demo purposes)"""
    status = verification_data.get("status", "verified")
    
    if status not in ["verified", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Use 'verified' or 'rejected'"
        )
    
    fake_users_db[current_user.username]["kyc_status"] = status
    fake_users_db[current_user.username]["kyc_completed"] = (status == "verified")
    
    return {
        "message": f"KYC {status}",
        "kyc_status": status,
        "kyc_completed": (status == "verified"),
        "profile_completed": fake_users_db[current_user.username]["profile_completed"]
    }

@router.get("/profile/status", response_model=KYCStatus)
async def get_profile_status(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get user's KYC and risk profile status"""
    user = fake_users_db[current_user.username]
    
    risk_profile = None
    if user["risk_score"] is not None:
        from backend.app.schemas.risk_profiling import calculate_risk_level
        risk_result = calculate_risk_level(user["risk_score"])
        risk_profile = RiskProfileResponse(
            risk_level=risk_result.level,
            score=user["risk_score"],
            profile_completed=user["profile_completed"]
        )
    
    return KYCStatus(
        kyc_completed=user["kyc_completed"],
        kyc_status=user["kyc_status"],
        profile_completed=user["profile_completed"],
        risk_profile=risk_profile
    )

@router.get("/profile/completed")
async def check_profile_completed(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Check if profile (KYC + Risk) is completed"""
    user = fake_users_db[current_user.username]
    
    profile_completed = user["profile_completed"] and user["kyc_completed"]
    
    return {
        "profile_completed": profile_completed,
        "kyc_completed": user["kyc_completed"],
        "risk_profile_completed": user["profile_completed"],
        "message": "Profile completed" if profile_completed else "Profile incomplete"
    }

print("? Authentication module loaded with risk profiling and KYC features")
