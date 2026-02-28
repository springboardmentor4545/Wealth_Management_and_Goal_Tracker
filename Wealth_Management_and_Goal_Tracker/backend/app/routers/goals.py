from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
from .. import models, schemas, database, auth

router = APIRouter(
    prefix="/goals",
    tags=["goals"]
)

# --- SAFE CALCULATIONS HELPER ---
def get_total_wealth(db: Session, user_id: int) -> float:
    """Safely calculates total wealth even if some prices are missing."""
    investments = db.query(models.Investment).filter(models.Investment.user_id == user_id).all()
    total = 0.0
    for inv in investments:
        qty = inv.quantity or 0
        price = inv.last_price or inv.average_buy_price or 0
        val = inv.current_value or (qty * price)
        total += val
    return total

def enhance_goal(g: models.Goal, total_wealth: float):
    """Safely attaches live metrics to the goal object without crashing Pydantic."""
    g.current_amount = total_wealth
    
    # Safely handle dates
    now_date = date.today()
    target = g.target_date
    
    if isinstance(target, datetime):
        target_date = target.date()
    elif isinstance(target, str):
        try:
            target_date = datetime.fromisoformat(target[:10]).date()
        except ValueError:
            target_date = now_date
    elif isinstance(target, date):
        target_date = target
    else:
        target_date = now_date 
        
    # Calculate duration
    diff = target_date - now_date
    months_remaining = max(0.0, diff.days / 30.44)
    g.duration_months = round(months_remaining, 1)

    # Calculate required monthly
    remaining_amount = g.target_amount - total_wealth
    if months_remaining > 0 and remaining_amount > 0:
        g.required_monthly_investment = round(remaining_amount / months_remaining, 2)
    else:
        g.required_monthly_investment = 0.0
        
    # Calculate progress
    if g.target_amount > 0:
        g.progress_percentage = round(min(100.0, (total_wealth / g.target_amount) * 100), 1)
    else:
        g.progress_percentage = 0.0
        
    return g

# --- ENDPOINTS ---

@router.post("/", response_model=schemas.GoalOut)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_goal = models.Goal(
        user_id=current_user.id,
        title=goal.title,
        target_amount=goal.target_amount,
        target_date=goal.target_date,
        monthly_contribution=goal.monthly_contribution,
        current_amount=0 
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    total_wealth = get_total_wealth(db, current_user.id)
    return enhance_goal(db_goal, total_wealth)


@router.get("/", response_model=List[schemas.GoalOut])
def read_goals(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    goals = db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()
    total_wealth = get_total_wealth(db, current_user.id)
    
    for g in goals:
        enhance_goal(g, total_wealth)
        
    return goals


@router.get("/{goal_id}", response_model=schemas.GoalOut)
def read_goal(goal_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    total_wealth = get_total_wealth(db, current_user.id)
    return enhance_goal(goal, total_wealth)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    db.delete(goal)
    db.commit()
    return None


@router.put("/{goal_id}", response_model=schemas.GoalOut)
def update_goal(goal_id: int, goal_update: schemas.GoalUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == current_user.id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_data = goal_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_goal, key, value)

    db.commit()
    db.refresh(db_goal)

    total_wealth = get_total_wealth(db, current_user.id)
    return enhance_goal(db_goal, total_wealth)