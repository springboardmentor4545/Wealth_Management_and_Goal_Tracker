from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from . import models, schemas
from .security import get_password_hash

router = APIRouter(
    prefix="/register",
    tags=["Auth"]
)

@router.post("", status_code=status.HTTP_201_CREATED)
def register_user(
    payload: schemas.UserRegisterRequest,
    db: Session = Depends(get_db),
):
    existing = db.query(models.User).filter(
        models.User.email == payload.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user = models.User(
        name=payload.name,
        email=payload.email,
        password=get_password_hash(payload.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}
