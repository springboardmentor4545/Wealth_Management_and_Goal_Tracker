# F. Simulations APIs

# backend/routes/simulations.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
from database import get_db_connection
from routes.auth import get_current_user
from services.simulation_engine import SimulationEngine
import json

router = APIRouter(
    prefix="/simulations",
    tags=["Simulations"]
)


# =========================
# REQUEST/RESPONSE SCHEMAS
# =========================

class SimulationAssumptions(BaseModel):
    initial_amount: float
    monthly_contribution: float
    time_horizon_years: int
    expected_return_percent: float
    inflation_rate_percent: float = 6.0
    target_amount: Optional[float] = None
    contribution_increase_percent: float = 0.0


class SimulationCreate(BaseModel):
    scenario_name: str
    description: Optional[str] = None
    goal_id: Optional[int] = None
    assumptions: SimulationAssumptions


class SimulationResponse(BaseModel):
    id: int
    user_id: int
    goal_id: Optional[int]
    scenario_name: str
    description: Optional[str]
    assumptions: Dict
    results: Dict
    created_at: str
    updated_at: str


# =========================
# F1. CREATE SIMULATION
# =========================

@router.post("/", response_model=SimulationResponse)
def create_simulation(
    simulation: SimulationCreate,
    user=Depends(get_current_user)
):
    """
    Create a new simulation
    - Runs calculations
    - Stores results
    - Returns complete simulation
    """
    conn = None
    cur = None
    
    try:
        # Convert assumptions to dict
        assumptions_dict = simulation.assumptions.dict()
        
        print(f"🔄 Running simulation: {simulation.scenario_name}")
        print(f"📊 Assumptions: {assumptions_dict}")
        
        # Run simulation (E3: Calculation Logic)
        results = SimulationEngine.run_simulation(assumptions_dict)
        
        print(f"✅ Simulation complete. Final value: ₹{results['final_value']:,.2f}")
        
        # E5: Ensure we don't modify real portfolio data
        # (Simulation engine is read-only, creates new calculations)
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Validate goal ownership if goal_id provided (F4)
        if simulation.goal_id:
            cur.execute("""
                SELECT id FROM goals 
                WHERE id = %s AND user_id = %s
            """, (simulation.goal_id, user['id']))
            
            if not cur.fetchone():
                raise HTTPException(
                    status_code=403, 
                    detail="Goal not found or you don't have access to it"
                )
        
        # Insert simulation
        cur.execute("""
            INSERT INTO simulations (
                user_id, 
                goal_id, 
                scenario_name, 
                description,
                assumptions, 
                results,
                created_at,
                updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING id, created_at, updated_at
        """, (
            user['id'],
            simulation.goal_id,
            simulation.scenario_name,
            simulation.description,
            json.dumps(assumptions_dict),
            json.dumps(results)
        ))
        
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=500, detail="Failed to create simulation")
        
        simulation_id = row['id']
        created_at = row['created_at']
        updated_at = row['updated_at']
        
        conn.commit()
        
        print(f"✅ Simulation saved with ID: {simulation_id}")
        
        return SimulationResponse(
            id=simulation_id,
            user_id=user['id'],
            goal_id=simulation.goal_id,
            scenario_name=simulation.scenario_name,
            description=simulation.description,
            assumptions=assumptions_dict,
            results=results,
            created_at=created_at.isoformat(),
            updated_at=updated_at.isoformat()
        )
        
    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ CREATE SIMULATION ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create simulation: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# F2. LIST USER SIMULATIONS
# =========================

@router.get("/", response_model=List[SimulationResponse])
def list_simulations(
    goal_id: Optional[int] = None,
    limit: int = 50,
    user=Depends(get_current_user)
):
    """
    Get all simulations for current user
    - Optional: Filter by goal_id
    - Returns list of simulations
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Build query (F4: Validate ownership)
        query = """
            SELECT 
                id, user_id, goal_id, scenario_name, description,
                assumptions, results, created_at, updated_at
            FROM simulations
            WHERE user_id = %s
        """
        params = [user['id']]
        
        # Optional goal filter
        if goal_id:
            query += " AND goal_id = %s"
            params.append(goal_id)
        
        query += " ORDER BY created_at DESC LIMIT %s"
        params.append(limit)
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        simulations = []
        for row in rows:
            simulations.append(SimulationResponse(
                id=row['id'],
                user_id=row['user_id'],
                goal_id=row['goal_id'],
                scenario_name=row['scenario_name'],
                description=row['description'],
                assumptions=row['assumptions'],
                results=row['results'],
                created_at=row['created_at'].isoformat(),
                updated_at=row['updated_at'].isoformat()
            ))
        
        print(f"✅ Fetched {len(simulations)} simulations for user {user['id']}")
        return simulations
        
    except Exception as e:
        print(f"❌ LIST SIMULATIONS ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch simulations")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# F3. GET SIMULATION DETAILS
# =========================

@router.get("/{simulation_id}", response_model=SimulationResponse)
def get_simulation(
    simulation_id: int,
    user=Depends(get_current_user)
):
    """
    Get detailed simulation by ID
    - Validates ownership (F4)
    - Returns full simulation data
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get simulation with ownership check (F4)
        cur.execute("""
            SELECT 
                id, user_id, goal_id, scenario_name, description,
                assumptions, results, created_at, updated_at
            FROM simulations
            WHERE id = %s AND user_id = %s
        """, (simulation_id, user['id']))
        
        row = cur.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=404, 
                detail="Simulation not found or you don't have access to it"
            )
        
        return SimulationResponse(
            id=row['id'],
            user_id=row['user_id'],
            goal_id=row['goal_id'],
            scenario_name=row['scenario_name'],
            description=row['description'],
            assumptions=row['assumptions'],
            results=row['results'],
            created_at=row['created_at'].isoformat(),
            updated_at=row['updated_at'].isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ GET SIMULATION ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch simulation")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# DELETE SIMULATION
# =========================

@router.delete("/{simulation_id}")
def delete_simulation(
    simulation_id: int,
    user=Depends(get_current_user)
):
    """
    Delete a simulation
    - Validates ownership
    - Removes from database
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Delete with ownership check
        cur.execute("""
            DELETE FROM simulations
            WHERE id = %s AND user_id = %s
            RETURNING id
        """, (simulation_id, user['id']))
        
        deleted = cur.fetchone()
        
        if not deleted:
            raise HTTPException(
                status_code=404, 
                detail="Simulation not found or you don't have access to it"
            )
        
        conn.commit()
        
        return {
            "message": "Simulation deleted successfully",
            "simulation_id": simulation_id
        }
        
    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ DELETE SIMULATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete simulation")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# COMPARE SCENARIOS
# =========================

@router.post("/compare")
def compare_scenarios(
    simulation_ids: List[int],
    user=Depends(get_current_user)
):
    """
    Compare multiple simulations side by side
    - Takes list of simulation IDs
    - Returns comparison data
    """
    conn = None
    cur = None
    
    try:
        if len(simulation_ids) < 2:
            raise HTTPException(
                status_code=400, 
                detail="Need at least 2 simulations to compare"
            )
        
        if len(simulation_ids) > 5:
            raise HTTPException(
                status_code=400, 
                detail="Can only compare up to 5 simulations at once"
            )
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Fetch simulations
        placeholders = ','.join(['%s'] * len(simulation_ids))
        cur.execute(f"""
            SELECT id, scenario_name, assumptions, results
            FROM simulations
            WHERE id IN ({placeholders}) AND user_id = %s
        """, (*simulation_ids, user['id']))
        
        rows = cur.fetchall()
        
        if len(rows) != len(simulation_ids):
            raise HTTPException(
                status_code=404, 
                detail="One or more simulations not found"
            )
        
        # Build comparison
        comparison = {
            'scenarios': [],
            'best_final_value': None,
            'best_roi': None,
            'lowest_risk': None
        }
        
        for row in rows:
            results = row['results']
            comparison['scenarios'].append({
                'id': row['id'],
                'name': row['scenario_name'],
                'final_value': results['final_value'],
                'total_invested': results['total_invested'],
                'total_returns': results['total_returns'],
                'roi_percent': results['return_on_investment_percent'],
                'cagr_percent': results.get('cagr_percent', 0)
            })
        
        # Find best scenarios
        sorted_by_value = sorted(
            comparison['scenarios'], 
            key=lambda x: x['final_value'], 
            reverse=True
        )
        comparison['best_final_value'] = sorted_by_value[0]['name']
        
        sorted_by_roi = sorted(
            comparison['scenarios'], 
            key=lambda x: x['roi_percent'], 
            reverse=True
        )
        comparison['best_roi'] = sorted_by_roi[0]['name']
        
        return comparison
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ COMPARE SCENARIOS ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to compare scenarios")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()