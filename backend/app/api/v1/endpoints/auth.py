from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.crud.user import (
    get_user_by_username,
    get_user_by_email,
    create_user,
)
from backend.app.schemas.user import UserCreate, UserResponse, UserLogin
from backend.app.schemas.token import Token, RefreshTokenRequest
from backend.app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already registered")

    if get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    return create_user(db=db, user=user)


@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, username=user.username)

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": create_access_token({"sub": db_user.username}),
        "refresh_token": create_refresh_token({"sub": db_user.username}),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
def refresh(token_request: RefreshTokenRequest):
    username = verify_token(token_request.refresh_token, token_type="refresh")

    if not username:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    return {
     "access_token": access_token,
     "refresh_token": refresh_token,
     "token_type": "bearer",
     "profile_completed": db_user.profile_completed
}
