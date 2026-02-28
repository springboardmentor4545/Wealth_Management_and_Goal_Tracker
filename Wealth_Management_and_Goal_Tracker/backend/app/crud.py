from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas, auth
from datetime import datetime

# --- USER MANAGEMENT ---

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

# --- GOALS MANAGEMENT ---

def get_user_goals(db: Session, user_id: int):
    goals = db.query(models.Goal).filter(models.Goal.user_id == user_id).all()
    for goal in goals:
        if goal.target_date:
            # Handle naive vs aware datetime for calculation
            target_date = goal.target_date.date() if hasattr(goal.target_date, 'date') else goal.target_date
            delta = target_date - datetime.now().date()
            goal.duration_months = max(1, delta.days // 30)
        
        total_invested = db.query(func.sum(models.Investment.cost_basis)).filter(models.Investment.user_id == user_id).scalar() or 0
        goal.total_invested = total_invested
        goal.completion_percentage = (total_invested / goal.target_amount * 100) if goal.target_amount > 0 else 0
    return goals

# --- PERFORMANCE ANALYTICS (MILESTONE 3) ---

def get_portfolio_analytics(db: Session, user_id: int):
    investments = db.query(models.Investment).filter(models.Investment.user_id == user_id).all()
    total_cost = 0
    total_value = 0
    allocation = {}

    for inv in investments:
        current_price = float(inv.last_price) if inv.last_price else float(inv.average_buy_price)
        market_value = float(inv.quantity) * current_price
        total_cost += float(inv.cost_basis)
        total_value += market_value
        a_type = inv.asset_type or "Stocks"
        allocation[a_type] = allocation.get(a_type, 0) + market_value

    profit_loss = total_value - total_cost
    p_l_pct = (profit_loss / total_cost * 100) if total_cost > 0 else 0
    allocation_pct = {k: (v / total_value * 100) for k, v in allocation.items()} if total_value > 0 else {}

    return {
        "summary": {
            "total_invested": total_cost,
            "current_value": total_value,
            "profit_loss": profit_loss,
            "p_l_percentage": p_l_pct
        },
        "allocation": allocation_pct
    }