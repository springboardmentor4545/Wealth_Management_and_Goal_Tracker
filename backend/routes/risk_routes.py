from fastapi import APIRouter, HTTPException
from database import get_db_connection

router = APIRouter(
    prefix="/risk",
    tags=["Risk Profiling"]
)

@router.get("/questions")
def get_risk_questions():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, question_text, weight
            FROM risk_questions
            ORDER BY id
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        return {
            "questions": [
                {
                    "question_id": r["id"],
                    "question": r["question_text"],
                    "weight": r["weight"]
                }
                for r in rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
