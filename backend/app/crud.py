from sqlalchemy.orm import Session
from . import models, schemas, auth


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed,
        risk_score=user.risk_score or 0,
        risk_category=user.risk_category or "unknown",
        profile_notes=user.profile_notes,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not auth.verify_password(password, user.hashed_password):
        return None
    return user


def update_user_risk(db: Session, user: models.User, score: int, category: str, notes: str = None, allocation: str = None):
    user.risk_score = score
    user.risk_category = category
    if notes is not None:
        user.profile_notes = notes
    if allocation is not None:
        user.allocation = allocation
    user.profile_completed = True
    user.kyc_status = "verified"
    db.add(user)
    db.commit()
    db.refresh(user)
    return user



def set_kyc_status(db: Session, user: models.User, status: str):
    user.kyc_status = status
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
