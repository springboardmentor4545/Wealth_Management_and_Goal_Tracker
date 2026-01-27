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
        conn = get_db_connection()
        cur = conn.cursor()

        # 🔒 1. CHECK IF USER EXISTS + PROFILE STATUS
        cur.execute("""
            SELECT profile_completed
            FROM users
            WHERE id = %s
        """, (data.user_id,))

        user = cur.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user["profile_completed"]:
            raise HTTPException(
                status_code=400,
                detail="Risk assessment already completed"
            )

        # 🔢 2. CALCULATE TOTAL SCORE
        total_score = sum(answer.score for answer in data.answers)

        # ✅ 3. SCORING LOGIC (UNCHANGED)
        if 0 <= total_score <= 10:
            profile = "conservative"
        elif 11 <= total_score <= 18:
            profile = "moderate"
        elif total_score >= 19:
            profile = "aggressive"
        else:
            raise HTTPException(status_code=400, detail="Invalid risk score")

        # 📝 4. UPDATE USER RECORD
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

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
