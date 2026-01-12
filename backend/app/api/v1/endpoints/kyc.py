from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/kyc", tags=["KYC"])


@router.post("/submit")
def submit_kyc(payload: dict, db: Session = Depends(get_db)):
    username = payload.get("username")
    score = int(payload.get("risk_score", 0))

    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Risk classification
    if score <= 10:
        level = "Conservative"
    elif score <= 18:
        level = "Moderate"
    else:
        level = "Aggressive"

    user.kyc_status = True
    user.risk_score = score
    user.risk_level = level
    user.profile_completed = True

    db.commit()

    return {
        "message": "KYC completed",
        "risk_level": level
    }
