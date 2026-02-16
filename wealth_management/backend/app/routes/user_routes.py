from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from ..database import get_db
from ..models import User, RiskProfileEnum, KYCStatusEnum
from ..schemas import UserCreate, UserLogin, RiskProfileSubmit, RiskProfileOut, ChangePassword
from ..auth import hash_password, verify_password, create_token
import os

SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

router = APIRouter(tags=["User"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def calculate_risk_profile(score: int) -> RiskProfileEnum:
    if score <= 10:
        return RiskProfileEnum.conservative
    elif score <= 18:
        return RiskProfileEnum.moderate
    else:
        return RiskProfileEnum.aggressive

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        profile_completed=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(db_user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "risk_profile": db_user.risk_profile,
            "kyc_status": db_user.kyc_status,
            "profile_completed": db_user.profile_completed
        }
    }

@router.post("/risk-profile", response_model=RiskProfileOut)
def submit_risk_profile(payload: RiskProfileSubmit, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_score = 0
    kyc_verified = False

    for qid, score in payload.answers.items():
        if qid == "kyc_verified":
            kyc_verified = bool(score)
        else:
            total_score += int(score)

    current_user.risk_profile = calculate_risk_profile(total_score)
    current_user.kyc_status = KYCStatusEnum.verified if kyc_verified else KYCStatusEnum.unverified
    current_user.profile_completed = current_user.kyc_status == KYCStatusEnum.verified

    db.commit()
    db.refresh(current_user)

    return {
        "risk_profile": current_user.risk_profile,
        "kyc_status": current_user.kyc_status,
        "profile_completed": current_user.profile_completed
    }

@router.post("/change-password")
def change_password(
    payload: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    current_user.password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password updated successfully"}