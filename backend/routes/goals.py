from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import date
from typing import List, Optional
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(
    prefix="/goals",
    tags=["Goals"]
)

ALLOWED_GOALS = {"retirement", "education", "travel", "emergency", "home", "vehicle"}

# =========================
# REQUEST SCHEMAS
# =========================

class GoalCreate(BaseModel):
    goal_type: str
    target_amount: float
    monthly_contribution: float
    target_date: date


class GoalUpdate(BaseModel):
    goal_type: str
    target_amount: float
    monthly_contribution: float
    target_date: date
    status: str


# =========================
# RESPONSE SCHEMA
# =========================

class GoalResponse(BaseModel):
    id: int
    goal_type: str
    target_amount: float
    monthly_contribution: float
    target_date: str
    status: str
    created_at: str

    duration_months: int
    months_passed: int
    total_invested: float
    progress_percentage: int
    required_monthly: float


# =========================
# HELPER: FINANCIAL LOGIC
# =========================

def calculate_goal_metrics(goal):
    today = date.today()

    duration_months = max(
        1,
        (goal["target_date"].year - today.year) * 12
        + (goal["target_date"].month - today.month)
    )

    created = goal["created_at"].date()
    months_passed = max(
        0,
        (today.year - created.year) * 12
        + (today.month - created.month)
    )

    total_invested = months_passed * goal["monthly_contribution"]

    progress_percentage = min(
        100,
        round((total_invested / goal["target_amount"]) * 100) if goal["target_amount"] > 0 else 0
    )

    required_monthly = round(
        goal["target_amount"] / duration_months, 2
    ) if duration_months > 0 else 0

    return {
        "duration_months": duration_months,
        "months_passed": months_passed,
        "total_invested": round(total_invested, 2),
        "progress_percentage": progress_percentage,
        "required_monthly": required_monthly,
    }


# =========================
# CREATE GOAL (SECURE + REQUIRES ASSESSMENT)
# =========================

@router.post("/")
def create_goal(
    goal: GoalCreate,
    user=Depends(get_current_user)
):
    conn = None
    cur = None
    
    try:
        # ✅ CHECK IF USER COMPLETED RISK ASSESSMENT
        if not user.get("profile_completed", False):
            raise HTTPException(
                status_code=403,
                detail="Please complete your risk assessment before creating goals. Click 'Take Assessment Now' on your dashboard."
            )

        goal_type = goal.goal_type.lower().strip()
        if goal_type not in ALLOWED_GOALS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid goal type. Allowed types: {', '.join(ALLOWED_GOALS)}"
            )

        # Validate amounts
        if goal.target_amount <= 0:
            raise HTTPException(status_code=400, detail="Target amount must be positive")
        
        if goal.monthly_contribution <= 0:
            raise HTTPException(status_code=400, detail="Monthly contribution must be positive")
        
        # Validate date
        if goal.target_date <= date.today():
            raise HTTPException(status_code=400, detail="Target date must be in the future")

        conn = get_db_connection()
        cur = conn.cursor()

        # ✅ FIX: Properly handle the RETURNING clause
        cur.execute(
            """
            INSERT INTO goals (
                user_id,
                goal_type,
                target_amount,
                monthly_contribution,
                target_date,
                status,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING id;
            """,
            (
                user["id"],
                goal_type,
                goal.target_amount,
                goal.monthly_contribution,
                goal.target_date,
                'active'
            ),
        )

        # ✅ FIX: RealDictCursor returns dict, not tuple
        result = cur.fetchone()
        
        if not result:
            raise HTTPException(
                status_code=500, 
                detail="Failed to create goal - no ID returned"
            )
        
        # Access 'id' from dictionary (RealDictCursor)
        goal_id = result['id']
        conn.commit()

        print(f"✅ Goal created successfully with ID: {goal_id}")
        
        return {"message": "Goal created successfully", "goal_id": goal_id}

    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ CREATE GOAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create goal: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# GET GOALS (SECURE + METRICS)
# =========================

@router.get("/", response_model=List[GoalResponse])
def get_goals(user=Depends(get_current_user)):
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT
                id,
                goal_type,
                target_amount,
                monthly_contribution,
                target_date,
                COALESCE(status, 'active') as status,
                created_at
            FROM goals
            WHERE user_id = %s
            ORDER BY created_at DESC;
            """,
            (user["id"],),
        )

        rows = cur.fetchall()

        goals = []
        for r in rows:
            # ✅ RealDictCursor returns dict, not tuple
            goal_data = {
                "id": r['id'],
                "goal_type": r['goal_type'],
                "target_amount": float(r['target_amount']),
                "monthly_contribution": float(r['monthly_contribution']),
                "target_date": r['target_date'],
                "status": r['status'],
                "created_at": r['created_at'],
            }

            metrics = calculate_goal_metrics(goal_data)

            goals.append({
                **goal_data,
                **metrics,
                "target_date": goal_data["target_date"].isoformat(),
                "created_at": goal_data["created_at"].isoformat(),
            })

        print(f"✅ Fetched {len(goals)} goals for user {user['id']}")
        return goals

    except Exception as e:
        print(f"❌ GET GOALS ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch goals")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# UPDATE GOAL (SECURE)
# =========================

@router.put("/{goal_id}")
def update_goal(
    goal_id: int,
    goal: GoalUpdate,
    user=Depends(get_current_user)
):
    conn = None
    cur = None
    
    try:
        goal_type = goal.goal_type.lower().strip()
        if goal_type not in ALLOWED_GOALS:
            raise HTTPException(status_code=400, detail="Invalid goal type")

        # Validate amounts
        if goal.target_amount <= 0:
            raise HTTPException(status_code=400, detail="Target amount must be positive")
        
        if goal.monthly_contribution <= 0:
            raise HTTPException(status_code=400, detail="Monthly contribution must be positive")

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            UPDATE goals
            SET
                goal_type = %s,
                target_amount = %s,
                monthly_contribution = %s,
                target_date = %s,
                status = %s
            WHERE id = %s AND user_id = %s
            RETURNING id;
            """,
            (
                goal_type,
                goal.target_amount,
                goal.monthly_contribution,
                goal.target_date,
                goal.status,
                goal_id,
                user["id"],
            ),
        )

        # RealDictCursor returns dict
        updated = cur.fetchone()
        conn.commit()

        if not updated:
            raise HTTPException(status_code=404, detail="Goal not found or you don't have permission")

        print(f"✅ Goal {goal_id} updated successfully")
        return {"message": "Goal updated successfully"}

    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ UPDATE GOAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update goal")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# DELETE GOAL (SECURE)
# =========================

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    user=Depends(get_current_user)
):
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "DELETE FROM goals WHERE id = %s AND user_id = %s RETURNING id;",
            (goal_id, user["id"]),
        )

        # RealDictCursor returns dict
        deleted = cur.fetchone()
        conn.commit()

        if not deleted:
            raise HTTPException(status_code=404, detail="Goal not found or you don't have permission")

        print(f"✅ Goal {goal_id} deleted successfully")
        return {"message": "Goal deleted successfully"}

    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ DELETE GOAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to delete goal")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()