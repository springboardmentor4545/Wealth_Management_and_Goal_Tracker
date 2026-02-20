from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal
from datetime import datetime

from ..database import get_db
from ..models import Simulation, Goal
from ..schemas import SimulationCreate, SimulationOut
from ..deps import get_current_user

router = APIRouter(tags=["Simulations"])



# COMPOUND SIP SIMULATION LOGIC
def run_simulation(
    monthly_contribution: float,
    expected_return: float,
    inflation: float,
    years: int,
    initial_investment: float = 0,
    goal_target: float = None,
):
    monthly = Decimal(str(monthly_contribution))
    expected_return = Decimal(str(expected_return))
    inflation = Decimal(str(inflation))
    years = int(years)
    initial_investment = Decimal(str(initial_investment))

    monthly_rate = expected_return / Decimal("100") / Decimal("12")
    total_months = years * 12

    future_value = initial_investment
    total_invested = initial_investment

    yearly_data = []

    for month in range(1, total_months + 1):
        future_value = (future_value * (1 + monthly_rate)) + monthly
        total_invested += monthly

        if month % 12 == 0:
            yearly_data.append({
                "year": month // 12,
                "invested": round(float(total_invested), 2),
                "future_value": round(float(future_value), 2)
            })

    inflation_adjusted_value = future_value / (
        (1 + inflation / Decimal("100")) ** Decimal(str(years))
    )

    result = {
        "total_invested": round(float(total_invested), 2),
        "future_value": round(float(future_value), 2),
        "inflation_adjusted_value": round(float(inflation_adjusted_value), 2),
        "years": years,
        "yearly_data": yearly_data,
    }

    # ---------- GOAL ANALYSIS ----------
    if goal_target:
        goal_target = Decimal(str(goal_target))
        difference = future_value - goal_target
        progress_percent = (future_value / goal_target) * Decimal("100")

        result["goal_target"] = round(float(goal_target), 2)
        result["goal_progress_percent"] = round(float(progress_percent), 2)
        result["difference_amount"] = round(float(difference), 2)

        if difference >= 0:
            result["status"] = "surplus"
            result["surplus_amount"] = round(float(difference), 2)
            result["shortfall_amount"] = 0.0
        else:
            result["status"] = "shortfall"
            result["shortfall_amount"] = round(float(abs(difference)), 2)
            result["surplus_amount"] = 0.0

    return result



# CREATE SIMULATION
@router.post("/", response_model=SimulationOut)
def create_simulation(
    simulation_data: SimulationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    goal_target = None

    if simulation_data.goal_id:
        goal = (
            db.query(Goal)
            .filter(
                Goal.id == simulation_data.goal_id,
                Goal.user_id == current_user.id,
            )
            .first()
        )

        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")

        goal_target = goal.target_amount

    assumptions = simulation_data.assumptions.dict()

    results = run_simulation(
        monthly_contribution=assumptions["monthly_contribution"],
        expected_return=assumptions["expected_return"],
        inflation=assumptions["inflation"],
        years=assumptions["time_horizon_years"],
        initial_investment=assumptions.get("initial_investment", 0),
        goal_target=goal_target,
    )

    simulation = Simulation(
        user_id=current_user.id,
        goal_id=simulation_data.goal_id,
        scenario_name=simulation_data.scenario_name,
        assumptions=assumptions,
        results=results,   
        created_at=datetime.utcnow(),
    )

    db.add(simulation)
    db.commit()
    db.refresh(simulation)

    return simulation



# LIST SIMULATIONS
@router.get("/", response_model=List[SimulationOut])
def list_simulations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    simulations = (
        db.query(Simulation)
        .options(joinedload(Simulation.goal))
        .filter(Simulation.user_id == current_user.id)
        .order_by(Simulation.created_at.desc())
        .all()
    )
    return simulations



# GET SINGLE SIMULATION
@router.get("/{simulation_id}", response_model=SimulationOut)
def get_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    simulation = (
        db.query(Simulation)
        .options(joinedload(Simulation.goal))
        .filter(
            Simulation.id == simulation_id,
            Simulation.user_id == current_user.id,
        )
        .first()
    )

    if not simulation:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return simulation
