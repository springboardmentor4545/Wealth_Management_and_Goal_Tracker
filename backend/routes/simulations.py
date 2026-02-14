# backend/routes/simulation.py

from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from math import pow
import json

from psycopg2.extras import RealDictCursor
from database import get_db_connection
from schema import SimulationCreate, SimulationUpdate  # add these classes in schema.py

router = APIRouter(prefix="/simulations", tags=["Simulations"])

# TEMP: keep same style as your project (you used TEST_USER_ID elsewhere)
TEST_USER_ID = 1


# -----------------------------
# Core simulation engine
# -----------------------------
def run_simulation(assumptions: dict) -> dict:
    """
    assumptions must contain:
      monthly_investment (number)
      years (int)
      expected_return (number)
      inflation_rate (number)
    Uses the SAME formulas from your mentor's screenshot.
    """

    # Validate required keys
    required = ["monthly_investment", "years", "expected_return", "inflation_rate"]
    for k in required:
        if k not in assumptions:
            raise HTTPException(status_code=400, detail=f"Missing assumption: {k}")

    try:
        monthly = float(assumptions["monthly_investment"])
        years = int(assumptions["years"])
        expected_return = float(assumptions["expected_return"])
        inflation = float(assumptions["inflation_rate"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid assumptions types. Use numbers for monthly_investment/expected_return/inflation_rate and int for years."
        )

    if monthly <= 0:
        raise HTTPException(status_code=400, detail="monthly_investment must be > 0")
    if years <= 0:
        raise HTTPException(status_code=400, detail="years must be > 0")

    # Formulas (as provided)
    total_invested = monthly * 12 * years
    future_value = total_invested * (1 + expected_return / 100)
    inflation_adjusted_value = future_value / pow((1 + inflation / 100), years)
    surplus = future_value - inflation_adjusted_value

    # Yearly breakdown (for line graph)
    yearly_breakdown = []
    for year in range(1, years + 1):
        invested_till = monthly * 12 * year
        future_till = invested_till * (1 + expected_return / 100)
        inflation_till = future_till / pow((1 + inflation / 100), year)

        yearly_breakdown.append({
            "year": year,
            "invested": round(invested_till, 2),
            "future_value": round(future_till, 2),
            "inflation_adjusted_value": round(inflation_till, 2),
        })

    return {
        "total_invested": round(total_invested, 2),
        "future_value": round(future_value, 2),
        "inflation_adjusted_value": round(inflation_adjusted_value, 2),
        "surplus": round(surplus, 2),
        "yearly_breakdown": yearly_breakdown
    }


# -----------------------------
# CREATE Simulation (Scenario)
# -----------------------------
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_simulation(payload: SimulationCreate):
    results = run_simulation(payload.assumptions)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute(
            """
            INSERT INTO simulations (user_id, goal_id, scenario_name, assumptions, results, created_at)
            VALUES (%s, %s, %s, %s::jsonb, %s::jsonb, %s)
            RETURNING *
            """,
            (
                TEST_USER_ID,
                payload.goal_id,
                payload.scenario_name,
                json.dumps(payload.assumptions),
                json.dumps(results),
                datetime.utcnow()
            )
        )
        row = cur.fetchone()
        conn.commit()
        return row
    finally:
        cur.close()
        conn.close()


# -----------------------------
# LIST Simulations (for user)
# -----------------------------
@router.get("/")
def list_simulations():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute(
            """
            SELECT *
            FROM simulations
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (TEST_USER_ID,)
        )
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


# -----------------------------
# GET one Simulation
# -----------------------------
@router.get("/{simulation_id}")
def get_simulation(simulation_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute(
            """
            SELECT *
            FROM simulations
            WHERE id = %s AND user_id = %s
            """,
            (simulation_id, TEST_USER_ID)
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Simulation not found")
        return row
    finally:
        cur.close()
        conn.close()


# -----------------------------
# UPDATE Simulation (What-if)
# Recompute results if assumptions change
# -----------------------------
@router.put("/{simulation_id}")
def update_simulation(simulation_id: int, payload: SimulationUpdate):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Get existing simulation
        cur.execute(
            """
            SELECT scenario_name, assumptions
            FROM simulations
            WHERE id = %s AND user_id = %s
            """,
            (simulation_id, TEST_USER_ID)
        )
        existing = cur.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Simulation not found")

        new_name = payload.scenario_name if payload.scenario_name is not None else existing["scenario_name"]
        new_assumptions = payload.assumptions if payload.assumptions is not None else existing["assumptions"]

        # Recompute results from assumptions
        new_results = run_simulation(new_assumptions)

        cur.execute(
            """
            UPDATE simulations
            SET scenario_name = %s,
                assumptions = %s::jsonb,
                results = %s::jsonb
            WHERE id = %s AND user_id = %s
            RETURNING *
            """,
            (
                new_name,
                json.dumps(new_assumptions),
                json.dumps(new_results),
                simulation_id,
                TEST_USER_ID
            )
        )

        updated = cur.fetchone()
        conn.commit()
        return updated
    finally:
        cur.close()
        conn.close()


# -----------------------------
# DELETE Simulation
# -----------------------------
@router.delete("/{simulation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_simulation(simulation_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            DELETE FROM simulations
            WHERE id = %s AND user_id = %s
            """,
            (simulation_id, TEST_USER_ID)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Simulation not found")
        conn.commit()
        return
    finally:
        cur.close()
        conn.close()
