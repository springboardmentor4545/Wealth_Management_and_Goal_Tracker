from backend.app.utils.risk import get_risk_category  # or wherever you place risk.py

# When submitting risk profile answers
@app.post("/api/v1/auth/risk-profile/submit")
async def submit_risk_profile(
    answers: dict,
    current_user: User = Depends(get_current_user)
):
    # Calculate total score from answers
    total_score = sum(answers.values())
    
    # Get risk category
    risk_category = get_risk_category(total_score)
    
    # Update user profile
    current_user.risk_score = total_score
    current_user.risk_level = risk_category
    
    # Save to database
    db.add(current_user)
    db.commit()
    
    return {
        "message": "Risk profile submitted successfully",
        "risk_score": total_score,
        "risk_level": risk_category
    }
