from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from .. import models, schemas, database, auth

router = APIRouter(
    prefix="/goals",
    tags=["goals"]
)

# --- Helper Logic for Calculations ---
def calculate_goal_metrics(goal: models.Goal):
    """
    Calculates dynamic metrics for a goal:
    - Duration (months remaining)
    - Required monthly investment to hit target
    - Progress %
    """
    now = datetime.now(timezone.utc)
    target = goal.target_date
    if target.tzinfo is None:
        # Assuming UTC if naive, though inputs should be aware
        pass 

    # 1. Duration (Months)
    # Simple difference in months
    diff = target - now
    months_remaining = diff.days / 30.44 # Average days in a month
    if months_remaining < 0:
        months_remaining = 0

    # 2. Required Monthly Investment
    # (Target - Current) / Months
    remaining_amount = goal.target_amount - goal.current_amount
    required_monthly = 0.0
    if months_remaining > 0 and remaining_amount > 0:
        required_monthly = remaining_amount / months_remaining
    
    # 3. Progress Percentage
    progress = 0.0
    if goal.target_amount > 0:
        progress = (goal.current_amount / goal.target_amount) * 100
        if progress > 100:
            progress = 100

    # Return a dict to update the schema instance or model
    # Note: We can't easily modify the SQLAlchemy model instance in place for these temporary fields check schema.
    return {
        "duration_months": round(months_remaining, 1),
        "required_monthly_investment": round(required_monthly, 2),
        "progress_percentage": round(progress, 1)
    }

# --- ENDPOINTS ---

@router.post("/", response_model=schemas.GoalOut)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_goal = models.Goal(
        user_id=current_user.id,
        title=goal.title,
        target_amount=goal.target_amount,
        target_date=goal.target_date,
        monthly_contribution=goal.monthly_contribution,
        current_amount=0 # Start with 0
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    # Calculate metrics for response
    metrics = calculate_goal_metrics(db_goal)
    # We construct the response manually or rely on Pydantic to merge if we passed a dict, 
    # but since response_model is a Pydantic object, we can return the ORM object and let Pydantic extract...
    # BUT Pydantic won't find the calculated fields on the ORM object unless we attach them.
    
    # Easiest way: attach to object (Python allows dynamic attributes)
    db_goal.duration_months = metrics["duration_months"]
    db_goal.required_monthly_investment = metrics["required_monthly_investment"]
    db_goal.progress_percentage = metrics["progress_percentage"]
    
    return db_goal

@router.get("/", response_model=List[schemas.GoalOut])
def read_goals(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    goals = db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()
    
    # Enhance specific goals with calculations
    for g in goals:
        metrics = calculate_goal_metrics(g)
        g.duration_months = metrics["duration_months"]
        g.required_monthly_investment = metrics["required_monthly_investment"]
        g.progress_percentage = metrics["progress_percentage"]
        
    return goals

@router.get("/{goal_id}", response_model=schemas.GoalOut)
def read_goal(goal_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id, models.Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    metrics = calculate_goal_metrics(goal)
    goal.duration_months = metrics["duration_months"]
    goal.required_monthly_investment = metrics["required_monthly_investment"]
    goal.progress_percentage = metrics["progress_percentage"]
    return goal

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
    
    # Update fields
    # Iterate over set fields in the update schema
    update_data = goal_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_goal, key, value)

    db.commit()
    db.refresh(db_goal)

    metrics = calculate_goal_metrics(db_goal)
    db_goal.duration_months = metrics["duration_months"]
    db_goal.required_monthly_investment = metrics["required_monthly_investment"]
    db_goal.progress_percentage = metrics["progress_percentage"]
    
    return db_goal
