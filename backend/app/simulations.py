from datetime import datetime
from decimal import Decimal
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .auth import get_current_user
from .database import get_db
from . import models, schemas

router = APIRouter(prefix="/simulations", tags=["Simulations"])


def _calculate_results(assumptions: schemas.SimulationAssumptions) -> Dict[str, str]:
    expected_return = float(assumptions.expected_return) / 100.0
    inflation = float(assumptions.inflation) / 100.0
    time_horizon_years = int(assumptions.time_horizon_years)

    if time_horizon_years <= 0:
        raise HTTPException(status_code=400, detail="Time horizon must be positive")

    initial = float(assumptions.initial_investment)
    monthly_contribution = float(assumptions.monthly_contribution)
    target_amount = float(assumptions.target_amount)

    real_return = (1.0 + expected_return) / (1.0 + inflation) - 1.0
    monthly_rate = (1.0 + real_return) ** (1.0 / 12.0) - 1.0
    months = time_horizon_years * 12

    if monthly_rate == 0:
        future_value = initial + monthly_contribution * months
    else:
        growth_factor = (1.0 + monthly_rate) ** months
        future_value = initial * growth_factor + monthly_contribution * ((growth_factor - 1.0) / monthly_rate)

    shortfall_or_surplus = future_value - target_amount

    return {
        "future_value": str(Decimal(f"{future_value:.2f}")),
        "shortfall_or_surplus": str(Decimal(f"{shortfall_or_surplus:.2f}")),
    }


@router.post("", response_model=schemas.SimulationResponse)
def create_simulation(
    payload: schemas.SimulationCreateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    results = _calculate_results(payload.assumptions)

    simulation = models.Simulation(
        user_id=user.id,
        assumptions=payload.assumptions.model_dump(),
        results=results,
        created_at=datetime.utcnow(),
    )

    db.add(simulation)
    db.commit()
    db.refresh(simulation)
    return simulation


@router.get("", response_model=list[schemas.SimulationResponse])
def list_simulations(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Simulation)
        .filter(models.Simulation.user_id == user.id)
        .order_by(models.Simulation.created_at.desc())
        .all()
    )


@router.get("/{simulation_id}", response_model=schemas.SimulationResponse)
def get_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    simulation = (
        db.query(models.Simulation)
        .filter(
            models.Simulation.user_id == user.id,
            models.Simulation.id == simulation_id,
        )
        .first()
    )

    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return simulation


@router.delete("/{simulation_id}")
def delete_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    simulation = (
        db.query(models.Simulation)
        .filter(
            models.Simulation.user_id == user.id,
            models.Simulation.id == simulation_id,
        )
        .first()
    )

    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")

    db.delete(simulation)
    db.commit()

    return {"message": "Simulation deleted"}
