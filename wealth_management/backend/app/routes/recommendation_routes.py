from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Investment, User
from .user_routes import get_current_user

router = APIRouter(tags=["Recommendations"])


# Risk-based target allocation
RISK_ALLOCATION = {
    "conservative": {"equity": 30, "debt": 50, "cash": 20},
    "moderate": {"equity": 60, "debt": 30, "cash": 10},
    "aggressive": {"equity": 80, "debt": 15, "cash": 5},
}


# Asset category mapping
def map_asset_to_category(asset_type):
    if not asset_type:
        return None

    asset = str(asset_type).lower()

    if "stock" in asset or "etf" in asset or "mutual" in asset:
        return "equity"

    if "bond" in asset:
        return "debt"

    if "cash" in asset:
        return "cash"

    return None


# Calculate allocation from investments
def calculate_current_allocation(investments):
    allocation = {"equity": 0, "debt": 0, "cash": 0}

    total_value = sum(float(inv.current_value or 0) for inv in investments)

    if total_value == 0:
        return allocation

    for inv in investments:
        category = map_asset_to_category(inv.asset_type)
        if category:
            allocation[category] += float(inv.current_value or 0)

    for key in allocation:
        allocation[key] = round((allocation[key] / total_value) * 100, 2)

    return allocation


# Generate suggestion list
def generate_recommendations(current, recommended):
    suggestions = []

    for asset in ["equity", "debt", "cash"]:
        diff = recommended[asset] - current[asset]

        if abs(diff) < 1:
            continue

        action = "Increase" if diff > 0 else "Reduce"

        suggestions.append({
            "asset_class": asset.capitalize(),
            "action": action,
            "change_percent": round(abs(diff), 2)
        })

    if not suggestions:
        return [{"message": "Portfolio is already balanced"}]

    return suggestions


#  MAIN API
@router.get("/")
def get_recommendation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    investments = (
        db.query(Investment)
        .filter(Investment.user_id == current_user.id)
        .all()
    )

    if not investments:
        raise HTTPException(status_code=404, detail="No investments found")

    current = calculate_current_allocation(investments)

    risk = current_user.risk_profile or "moderate"
    recommended = RISK_ALLOCATION.get(risk, RISK_ALLOCATION["moderate"])

    suggestions = generate_recommendations(current, recommended)

    return {
        "risk_profile": risk,
        "current_allocation": current,
        "recommended_allocation": recommended,
        "recommendations": suggestions
    }
