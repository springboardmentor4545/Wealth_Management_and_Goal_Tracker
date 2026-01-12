from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.risk import get_risk_category
from app.models.user import User

router = APIRouter(prefix="/risk", tags=["risk"])

@router.post("/submit")
def submit_risk(score: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.risk_score = score
    user.kyc_status = True
    user.profile_completed = True

    db.commit()

    return {
        "risk_score": score,
        "category": get_risk_category(score),
        "profile_completed": True
    }
