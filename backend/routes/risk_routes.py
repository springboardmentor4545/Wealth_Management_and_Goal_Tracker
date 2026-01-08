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
            SELECT 
                id,
                question,
                option1,
                option2,
                option3,
                option1_score,
                option2_score,
                option3_score
            FROM risk_questions
            ORDER BY id
        """)

        rows = cur.fetchall()

        cur.close()
        conn.close()

        return {
            "questions": [
                {
                    "question_id": r[0],
                    "question": r[1],
                    "options": [
                        {"text": r[2], "score": r[5]},
                        {"text": r[3], "score": r[6]},
                        {"text": r[4], "score": r[7]},
                    ]
                }
                for r in rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
