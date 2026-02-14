from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor
from database import get_db_connection

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

TEST_USER_ID = 1

# 1) Allocation Strategy
ALLOCATION_RULES = {
    "conservative": {"equity": 30, "debt": 60, "cash": 10},
    "moderate":     {"equity": 60, "debt": 30, "cash": 10},
    "aggressive":   {"equity": 80, "debt": 15, "cash": 5},
}

# Map your asset_type -> category
ASSET_CATEGORY_MAP = {
    "stock": "equity",
    "etf": "equity",
    "mutual_fund": "equity",
    "bond": "debt",
    "cash": "cash",
}


def get_user_risk_profile(user_id: int) -> str:
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT risk_profile FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return (row["risk_profile"] or "moderate").lower()
    finally:
        cur.close()
        conn.close()


def get_user_investments(user_id: int):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            """
            SELECT asset_type, current_value, cost_basis
            FROM investments
            WHERE user_id = %s
            """,
            (user_id,)
        )
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


def calculate_current_allocation(investments) -> dict:
    """
    Returns:
      {
        "total_value": float,
        "current": {"equity": %, "debt": %, "cash": %}
      }
    """
    totals = {"equity": 0.0, "debt": 0.0, "cash": 0.0}
    total_value = 0.0

    for inv in investments:
        asset_type = (inv.get("asset_type") or "").lower()
        category = ASSET_CATEGORY_MAP.get(asset_type)

        # Prefer current_value; fallback to cost_basis if current_value is None
        value = inv.get("current_value")
        if value is None:
            value = inv.get("cost_basis") or 0.0

        value = float(value or 0.0)

        if category:
            totals[category] += value
            total_value += value

    if total_value <= 0:
        # Empty portfolio: show 0 allocations
        return {
            "total_value": 0.0,
            "current": {"equity": 0.0, "debt": 0.0, "cash": 0.0}
        }

    current_pct = {
        k: round((v / total_value) * 100, 2)
        for k, v in totals.items()
    }

    return {"total_value": round(total_value, 2), "current": current_pct}


def generate_rebalance_suggestions(current: dict, recommended: dict, threshold: float = 2.0):
    """
    threshold = ignore small diffs under 2%
    """
    suggestions = []
    for category in ["equity", "debt", "cash"]:
        cur = float(current.get(category, 0.0))
        rec = float(recommended.get(category, 0.0))
        diff = round(rec - cur, 2)  # positive => need increase

        if abs(diff) < threshold:
            continue

        if diff > 0:
            suggestions.append({
                "category": category,
                "action": "increase",
                "difference_percent": abs(diff),
                "message": f"Increase {category} exposure by {abs(diff)}%"
            })
        else:
            suggestions.append({
                "category": category,
                "action": "decrease",
                "difference_percent": abs(diff),
                "message": f"Reduce {category} exposure by {abs(diff)}%"
            })

    return suggestions


# 5) APIs

@router.get("/allocation")
def get_allocation():
    risk = get_user_risk_profile(TEST_USER_ID)

    if risk not in ALLOCATION_RULES:
        risk = "moderate"

    recommended = ALLOCATION_RULES[risk]

    investments = get_user_investments(TEST_USER_ID)
    allocation = calculate_current_allocation(investments)

    return {
        "risk_profile": risk,
        "recommended": recommended,
        "current": allocation["current"],
        "total_value": allocation["total_value"]
    }


@router.get("/rebalance")
def get_rebalance():
    risk = get_user_risk_profile(TEST_USER_ID)

    if risk not in ALLOCATION_RULES:
        risk = "moderate"

    recommended = ALLOCATION_RULES[risk]

    investments = get_user_investments(TEST_USER_ID)
    allocation = calculate_current_allocation(investments)

    suggestions = generate_rebalance_suggestions(
        current=allocation["current"],
        recommended=recommended,
        threshold=2.0
    )

    return {
        "risk_profile": risk,
        "recommended": recommended,
        "current": allocation["current"],
        "suggestions": suggestions
    }
