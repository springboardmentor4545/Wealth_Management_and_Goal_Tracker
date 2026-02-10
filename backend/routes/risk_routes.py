from fastapi import APIRouter, HTTPException
from database import get_db_connection
from schema import RiskAssessmentSubmit

# ✅ ROUTER MUST BE DEFINED FIRST
router = APIRouter(
    prefix="/risk",
    tags=["Risk Profiling"]
)

# =========================
# GET RISK QUESTIONS
# =========================
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
                    "question_id": r["id"],
                    "question": r["question"],
                    "options": [
                        {"text": r["option1"], "score": r["option1_score"]},
                        {"text": r["option2"], "score": r["option2_score"]},
                        {"text": r["option3"], "score": r["option3_score"]},
                    ]
                }
                for r in rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# SUBMIT RISK ASSESSMENT
# =========================
@router.post("/assessment")
def submit_risk_assessment(data: RiskAssessmentSubmit):
    try:
        # Calculate total score from answers
        total_score = sum(answer.score for answer in data.answers)

        # ✅ SCORING LOGIC
        if 0 <= total_score <= 10:
            profile = "conservative"
        elif 11 <= total_score <= 18:
            profile = "moderate"
        elif total_score >= 19:
            profile = "aggressive"
        else:
            raise HTTPException(status_code=400, detail="Invalid risk score")

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            UPDATE users
            SET 
                risk_score = %s,
                risk_profile = %s,
                profile_completed = TRUE,
                kyc_status = %s
            WHERE id = %s
        """, (total_score, profile, data.kyc_status, data.user_id))

        conn.commit()
        cur.close()
        conn.close()

        return {
            "message": "Risk profiling completed",
            "risk_score": total_score,
            "risk_profile": profile,
            "kyc_status": data.kyc_status
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
