from typing import List
from pydantic import BaseModel

class RiskQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    scores: List[int]  # Scores for each option (1-5)

class RiskProfileResult(BaseModel):
    score: int
    level: str
    description: str

# Risk profiling questions
RISK_QUESTIONS = [
    RiskQuestion(
        id=1,
        question="What is your investment time horizon?",
        options=[
            "Less than 1 year",
            "1-3 years", 
            "3-5 years",
            "5-10 years",
            "More than 10 years"
        ],
        scores=[1, 2, 3, 4, 5]
    ),
    RiskQuestion(
        id=2,
        question="What is your primary investment goal?",
        options=[
            "Capital preservation",
            "Regular income",
            "Balanced growth",
            "Growth",
            "Aggressive growth"
        ],
        scores=[1, 2, 3, 4, 5]
    ),
    RiskQuestion(
        id=3,
        question="How would you react to a 20% market decline?",
        options=[
            "Sell all investments",
            "Sell some investments",
            "Hold and wait",
            "Buy more cautiously",
            "Buy aggressively"
        ],
        scores=[1, 2, 3, 4, 5]
    ),
    RiskQuestion(
        id=4,
        question="What percentage of your income do you invest?",
        options=[
            "Less than 5%",
            "5-10%",
            "10-20%",
            "20-30%",
            "More than 30%"
        ],
        scores=[1, 2, 3, 4, 5]
    ),
    RiskQuestion(
        id=5,
        question="How familiar are you with financial markets?",
        options=[
            "Not familiar at all",
            "Somewhat familiar",
            "Moderately familiar",
            "Very familiar",
            "Expert level"
        ],
        scores=[1, 2, 3, 4, 5]
    ),
    RiskQuestion(
        id=6,
        question="What is your acceptable loss tolerance?",
        options=[
            "0-5% loss",
            "5-10% loss",
            "10-15% loss", 
            "15-20% loss",
            "More than 20% loss"
        ],
        scores=[1, 2, 3, 4, 5]
    ),
    RiskQuestion(
        id=7,
        question="How do you manage emergency funds?",
        options=[
            "6+ months expenses in cash",
            "3-6 months expenses",
            "1-3 months expenses",
            "Less than 1 month",
            "No emergency fund"
        ],
        scores=[5, 4, 3, 2, 1]  # Reversed scoring
    )
]

def calculate_risk_level(score: int) -> RiskProfileResult:
    """Calculate risk level based on score"""
    if score <= 10:
        return RiskProfileResult(
            score=score,
            level="Conservative",
            description="Prefers capital preservation with low risk tolerance. Suitable for stable, low-return investments."
        )
    elif score <= 18:
        return RiskProfileResult(
            score=score,
            level="Moderate",
            description="Balances risk and return. Suitable for diversified portfolios with moderate growth."
        )
    else:  # 19+
        return RiskProfileResult(
            score=score,
            level="Aggressive",
            description="Seeks high returns and accepts high volatility. Suitable for growth-oriented investments."
        )

def validate_answers(answers: dict) -> bool:
    """Validate that all answers are within valid range"""
    if not answers:
        return False
    
    for question_id, answer in answers.items():
        if not (1 <= question_id <= len(RISK_QUESTIONS)):
            return False
        if not (1 <= answer <= 5):
            return False
    return True

def calculate_total_score(answers: dict) -> int:
    """Calculate total risk score from answers"""
    total_score = 0
    for question_id, answer in answers.items():
        question = RISK_QUESTIONS[question_id - 1]
        total_score += question.scores[answer - 1]
    return total_score
