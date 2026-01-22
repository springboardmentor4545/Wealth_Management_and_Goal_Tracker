from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from ..database import get_db
from ..models import Goal, User, GoalStatusEnum
from ..schemas import GoalCreate, GoalOut, GoalUpdate
from ..deps import get_current_user

router = APIRouter(tags=["Goals"])


def calculate_goal_progress(goal: Goal):
    today = date.today()
    start = goal.created_at

    total_months = max(
        1,
        (goal.target_date.year - start.year) * 12
        + (goal.target_date.month - start.month)
        + 1
    )

    months_passed = max(
        1,
        (today.year - start.year) * 12
        + (today.month - start.month)
        + 1
    )

    invested = months_passed * goal.monthly_contribution
    progress = min(100, (invested / goal.target_amount) * 100)

    return {
        "months_remaining": max(0, total_months - months_passed),
        "invested_so_far": round(invested, 2),
        "progress_percentage": round(progress, 2),
        "status": GoalStatusEnum.completed if progress >= 100 else goal.status,
    }


@router.post("/", response_model=GoalOut)
def create_goal(goal: GoalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    g = Goal(user_id=user.id, **goal.dict())
    db.add(g)
    db.commit()
    db.refresh(g)
    return {**g.__dict__, **calculate_goal_progress(g)}


@router.get("/", response_model=list[GoalOut])
def list_goals(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    return [{**g.__dict__, **calculate_goal_progress(g)} for g in goals]


@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, data: GoalUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")

    for k, v in data.dict(exclude_unset=True).items():
        setattr(goal, k, v)

    db.commit()
    db.refresh(goal)
    return {**goal.__dict__, **calculate_goal_progress(goal)}


@router.patch("/{goal_id}/status", response_model=GoalOut)
def update_status(goal_id: int, status: GoalStatusEnum, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")

    goal.status = status
    db.commit()
    db.refresh(goal)
    return {**goal.__dict__, **calculate_goal_progress(goal)}


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")

    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}
