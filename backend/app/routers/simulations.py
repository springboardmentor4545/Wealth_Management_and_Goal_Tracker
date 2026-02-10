from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json
from .. import models, schemas, database, auth

router = APIRouter(
    prefix="/simulations",
    tags=["simulations"]
)

def calculate_simulation(assumptions: dict):
    """
    Logic for Future Value Simulation.
    assumptions: {
        "current_balance": float,
        "monthly_contribution": float,
        "annual_return": float, (e.g. 7.0 for 7%)
        "years": int,
        "inflation": float (optional),
        "target_amount": float (optional)
    }
    """
    balance = float(assumptions.get("current_balance", 0))
    monthly = float(assumptions.get("monthly_contribution", 0))
    rate = float(assumptions.get("annual_return", 0)) / 100
    years = int(assumptions.get("years", 10))
    target = float(assumptions.get("target_amount", 0))
    
    r_monthly = rate / 12
    months = years * 12
    
    if r_monthly > 0:
        fv_principal = balance * (1 + r_monthly)**months
        fv_contributions = monthly * (((1 + r_monthly)**months - 1) / r_monthly)
        total_fv = fv_principal + fv_contributions
    else:
        total_fv = balance + (monthly * months)
        
    total_invested = balance + (monthly * months)
    profit = total_fv - total_invested
    
    shortfall_surplus = 0
    if target > 0:
        shortfall_surplus = total_fv - target

    return {
        "future_value": round(total_fv, 2),
        "total_invested": round(total_invested, 2),
        "estimated_profit": round(profit, 2),
        "years": years,
        "target_amount": target,
        "shortfall_surplus": round(shortfall_surplus, 2),
        "goal_met": total_fv >= target if target > 0 else None
    }

@router.post("/", response_model=schemas.SimulationOut)
def create_simulation(sim_in: schemas.SimulationCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    results = calculate_simulation(sim_in.assumptions)
    
    new_sim = models.Simulation(
        user_id=current_user.id,
        title=sim_in.title,
        assumptions=json.dumps(sim_in.assumptions),
        results=json.dumps(results)
    )
    db.add(new_sim)
    db.commit()
    db.refresh(new_sim)
    
    # Convert back to dict for response
    new_sim.assumptions = json.loads(new_sim.assumptions)
    new_sim.results = json.loads(new_sim.results)
    return new_sim

@router.get("/", response_model=List[schemas.SimulationOut])
def get_simulations(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    sims = db.query(models.Simulation).filter(models.Simulation.user_id == current_user.id).all()
    for s in sims:
        s.assumptions = json.loads(s.assumptions)
        s.results = json.loads(s.results)
    return sims

@router.get("/{sim_id}", response_model=schemas.SimulationOut)
def get_simulation(sim_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    sim = db.query(models.Simulation).filter(models.Simulation.id == sim_id, models.Simulation.user_id == current_user.id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    sim.assumptions = json.loads(sim.assumptions)
    sim.results = json.loads(sim.results)
    return sim

@router.delete("/{sim_id}")
def delete_simulation(sim_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    sim = db.query(models.Simulation).filter(models.Simulation.id == sim_id, models.Simulation.user_id == current_user.id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    db.delete(sim)
    db.commit()
    return {"message": "Simulation deleted"}
