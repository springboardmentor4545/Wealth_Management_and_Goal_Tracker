# backend/app/goals.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import date

from .database import get_db
from .auth import get_current_user
from . import models, schemas

router = APIRouter(
    prefix="/goals",
    tags=["Goals"]
)


def _months_between(start: date, end: date) -> int:
    if end < start:
        return 0
    months = (end.year - start.year) * 12 + (end.month - start.month)
    if end.day >= start.day:
        months += 1
    return max(0, months)


def _serialize_goal(goal: models.Goal) -> dict:
    today = date.today()
    duration_months = 0
    if goal.deadline:
        duration_months = _months_between(goal.start_date, goal.deadline)

    months_elapsed = _months_between(goal.start_date, today)
    if duration_months:
        months_elapsed = min(months_elapsed, duration_months)

    invested_amount = Decimal(months_elapsed) * Decimal(goal.monthly_contribution or 0)
    target_amount = Decimal(goal.target_amount or 0)
    remaining_amount = max(Decimal("0"), target_amount - invested_amount)
    progress_percent = Decimal("0")
    if target_amount > 0:
        progress_percent = (invested_amount / target_amount) * Decimal("100")
        progress_percent = min(progress_percent, Decimal("100"))

    return {
        "id": goal.id,
        "title": goal.title,
        "description": goal.description,
        "status": goal.status or "active",
        "target_amount": goal.target_amount,
        "monthly_contribution": goal.monthly_contribution,
        "start_date": goal.start_date,
        "deadline": goal.deadline,
        "invested_amount": invested_amount,
        "remaining_amount": remaining_amount,
        "duration_months": duration_months,
        "progress_percent": int(progress_percent),
        "created_at": goal.created_at,
    }

@router.get("", response_model=list[schemas.GoalResponse])
def list_goals(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    goals = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).all()
    return [_serialize_goal(goal) for goal in goals]


@router.post("", response_model=schemas.GoalResponse)
def create_goal(
    payload: schemas.GoalCreateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    goal = models.Goal(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        target_amount=payload.target_amount,
        monthly_contribution=payload.monthly_contribution,
        start_date=payload.start_date,
        deadline=payload.deadline,
    )

    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _serialize_goal(goal)


@router.put("/{goal_id}", response_model=schemas.GoalResponse)
def update_goal(
    goal_id: int,
    payload: schemas.GoalUpdateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == user.id,
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if payload.status is not None:
        if payload.status not in ("active", "paused"):
            raise HTTPException(status_code=400, detail="Invalid status")
        goal.status = payload.status

    for field in (
        "title",
        "description",
        "target_amount",
        "monthly_contribution",
        "start_date",
        "deadline",
    ):
        value = getattr(payload, field)
        if value is not None:
            setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    return _serialize_goal(goal)


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == user.id,
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}
