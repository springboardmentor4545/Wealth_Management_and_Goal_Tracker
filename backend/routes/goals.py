from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from database import get_db_connection
from schemas import GoalCreate, GoalUpdate
import os

router = APIRouter(prefix="/goals", tags=["Goals"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


def ensure_goals_table(cur):
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS goals (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            goal_type VARCHAR(20)
                CHECK (goal_type IN ('retirement', 'home', 'education', 'custom'))
                DEFAULT 'custom',
            title VARCHAR(120),
            target_amount NUMERIC NOT NULL,
            target_date DATE NOT NULL,
            monthly_contribution NUMERIC NOT NULL,
            status VARCHAR(20)
                CHECK (status IN ('active', 'paused', 'completed'))
                DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    )
    # Ensure title exists for older schemas
    cur.execute("ALTER TABLE goals ADD COLUMN IF NOT EXISTS title VARCHAR(120);")


def get_user_id_from_token(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user["id"]

@router.get("")
def get_goals(user_id: int = Depends(get_user_id_from_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        ensure_goals_table(cur)
        cur.execute(
            """
            SELECT id, user_id, title, target_amount, target_date, monthly_contribution, status, created_at
            FROM goals
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        rows = cur.fetchall()
        return {"goals": rows}
    finally:
        cur.close()
        conn.close()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, user_id: int = Depends(get_user_id_from_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        ensure_goals_table(cur)
        # Check if goal_type exists to satisfy NOT NULL
        cur.execute(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_name='goals' AND column_name='goal_type'
            """
        )
        has_goal_type = cur.fetchone() is not None

        if has_goal_type:
            cur.execute(
                """
                INSERT INTO goals (user_id, goal_type, title, target_amount, target_date, monthly_contribution, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, user_id, title, target_amount, target_date, monthly_contribution, status, created_at
                """,
                (
                    user_id,
                    "custom",
                    payload.title,
                    payload.target_amount,
                    payload.target_date,
                    payload.monthly_contribution,
                    payload.status.value,
                ),
            )
        else:
            cur.execute(
                """
                INSERT INTO goals (user_id, title, target_amount, target_date, monthly_contribution, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, user_id, title, target_amount, target_date, monthly_contribution, status, created_at
                """,
                (
                    user_id,
                    payload.title,
                    payload.target_amount,
                    payload.target_date,
                    payload.monthly_contribution,
                    payload.status.value,
                ),
            )

        goal = cur.fetchone()
        conn.commit()
        return goal
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@router.put("/{goal_id}")
def update_goal(goal_id: int, payload: GoalUpdate, user_id: int = Depends(get_user_id_from_token)):
    update_fields = payload.model_dump(exclude_unset=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    sets = []
    values = []
    for key, value in update_fields.items():
        sets.append(f"{key} = %s")
        values.append(value.value if hasattr(value, "value") else value)
    values.extend([user_id, goal_id])

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        ensure_goals_table(cur)
        cur.execute(
            f"""
            UPDATE goals
            SET {', '.join(sets)}
            WHERE user_id = %s AND id = %s
            RETURNING id, user_id, title, target_amount, target_date, monthly_contribution, status, created_at
            """
        , values)
        goal = cur.fetchone()
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        conn.commit()
        return goal
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, user_id: int = Depends(get_user_id_from_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        ensure_goals_table(cur)
        cur.execute(
            "DELETE FROM goals WHERE user_id = %s AND id = %s RETURNING id",
            (user_id, goal_id),
        )
        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Goal not found")
        conn.commit()
        return None
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
