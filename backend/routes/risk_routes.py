from fastapi import APIRouter, HTTPException
from database import get_db_connection
from schemas import RiskAssessmentSubmit
from psycopg2.extras import RealDictCursor

router = APIRouter(
    prefix="/risk",
    tags=["Risk Profiling"]
)

@router.get("/questions")
def get_risk_questions():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT id as question_id, question, option1, option2, option3
            FROM risk_questions
            ORDER BY id
        """)

        rows = cur.fetchall()

        questions = []
        for row in rows:
            questions.append({
                "question_id": row["question_id"],
                "question": row["question"],
                "options": [
                    {"option_id": 1, "text": row["option1"]},
                    {"option_id": 2, "text": row["option2"]},
                    {"option_id": 3, "text": row["option3"]}
                ]
            })

        return {"questions": questions}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()

@router.post("/assessment")
def submit_risk_assessment(data: RiskAssessmentSubmit):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        total_score = 0

        # 🔐 Secure score calculation from DB
        for ans in data.answers:
            cur.execute("""
                SELECT 
                    CASE %s
                        WHEN 1 THEN option1_score
                        WHEN 2 THEN option2_score
                        WHEN 3 THEN option3_score
                    END AS score
                FROM risk_questions
                WHERE id = %s
            """, (ans.option_id, ans.question_id))

            row = cur.fetchone()

            if not row or row["score"] is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid answer for question {ans.question_id}"
                )

            total_score += row["score"]

        # 🎯 Risk profile logic
        if total_score <= 10:
            profile = "conservative"
        elif total_score <= 18:
            profile = "moderate"
        else:
            profile = "aggressive"

        # ✅ Update user table
        cur.execute("""
            UPDATE users
            SET 
                risk_score = %s,
                risk_profile = %s,
                profile_completed = TRUE,
                kyc_status = 'verified'
            WHERE id = %s
            RETURNING id
        """, (total_score, profile, data.user_id))

        if cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="User not found")

        conn.commit()

        return {
            "message": "Risk assessment completed",
            "risk_score": total_score,
            "risk_profile": profile
        }

    except HTTPException:
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()
