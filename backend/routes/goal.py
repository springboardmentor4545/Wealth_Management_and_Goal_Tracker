from fastapi import APIRouter, HTTPException, status
from database import get_db_connection
from schema import GoalCreate, GoalResponse, GoalBase
from datetime import date
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/goals", tags=["Goals"])

TEST_USER_ID = 1


# -----------------------------
# Helper: calculate months
# -----------------------------
def calculate_duration_months(start: date, end: date) -> int:
    return max((end.year - start.year) * 12 + (end.month - start.month), 1)


# -----------------------------
# Create Goal
# -----------------------------
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_goal(goal: GoalCreate):
    if goal.target_date < date.today():
        raise HTTPException(status_code=400, detail="Target date cannot be in the past")

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            INSERT INTO goals (
                user_id,
                goal_type,
                target_amount,
                target_date,
                monthly_contribution,
                status
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING
                id AS goal_id,
                user_id,
                goal_type,
                target_amount,
                target_date,
                monthly_contribution,
                status,
                created_at
        """, (
            TEST_USER_ID,
            goal.goal_type.value,
            goal.target_amount,
            goal.target_date,
            goal.monthly_contribution,
            goal.status.value
        ))

        row = cur.fetchone()
        conn.commit()

        # -------- FINANCIAL LOGIC --------
        duration_months = calculate_duration_months(date.today(), row["target_date"])
        required_monthly = row["target_amount"] / duration_months

        return {
            **row,
            "duration_months": duration_months,
            "required_monthly_investment": round(required_monthly, 2),
            "total_invested": 0,
            "completion_percentage": 0
        }

    finally:
        cur.close()
        conn.close()


# -----------------------------
# Get All Goals
# -----------------------------
@router.get("/")
def get_goals():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            SELECT
                id AS goal_id,
                user_id,
                goal_type,
                target_amount,
                target_date,
                monthly_contribution,
                status,
                created_at
            FROM goals
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (TEST_USER_ID,))

        goals = cur.fetchall()
        today = date.today()
        enriched = []

        for g in goals:
            duration_months = calculate_duration_months(today, g["target_date"])
            required_monthly = g["target_amount"] / duration_months

            enriched.append({
                **g,
                "duration_months": duration_months,
                "required_monthly_investment": round(required_monthly, 2),
                "total_invested": 0,
                "completion_percentage": 0
            })

        return enriched

    finally:
        cur.close()
        conn.close()


# -----------------------------
# Update Goal
# -----------------------------
@router.put("/{goal_id}")
def update_goal(goal_id: int, updated_goal: GoalBase):
    if updated_goal.target_date < date.today():
        raise HTTPException(status_code=400, detail="Target date cannot be in the past")

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("""
            UPDATE goals
            SET
                goal_type = %s,
                target_amount = %s,
                target_date = %s,
                monthly_contribution = %s,
                status = %s
            WHERE id = %s AND user_id = %s
            RETURNING
                id AS goal_id,
                user_id,
                goal_type,
                target_amount,
                target_date,
                monthly_contribution,
                status,
                created_at
        """, (
            updated_goal.goal_type.value,
            updated_goal.target_amount,
            updated_goal.target_date,
            updated_goal.monthly_contribution,
            updated_goal.status.value,
            goal_id,
            TEST_USER_ID
        ))

        g = cur.fetchone()
        if not g:
            raise HTTPException(status_code=404, detail="Goal not found")

        conn.commit()

        duration_months = calculate_duration_months(date.today(), g["target_date"])
        required_monthly = g["target_amount"] / duration_months

        return {
            **g,
            "duration_months": duration_months,
            "required_monthly_investment": round(required_monthly, 2),
            "total_invested": 0,
            "completion_percentage": 0
        }

    finally:
        cur.close()
        conn.close()


# -----------------------------
# Delete Goal (Hard delete for now)
# -----------------------------
@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            DELETE FROM goals
            WHERE id = %s AND user_id = %s
        """, (goal_id, TEST_USER_ID))

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Goal not found")

        conn.commit()

    finally:
        cur.close()
        conn.close()
