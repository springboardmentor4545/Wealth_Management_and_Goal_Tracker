from fastapi import APIRouter, HTTPException, Body, Depends
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

ALLOWED_ASSET_TYPES = {"stock", "etf", "mutual_fund", "bond", "cash"}


# =========================
# BUY ASSET
# =========================
@router.post("/buy")
def buy_asset(
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    asset_type = str(payload["asset_type"]).strip().lower()
    if asset_type not in ALLOWED_ASSET_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid asset_type '{asset_type}'. Allowed: {sorted(list(ALLOWED_ASSET_TYPES))}"
        )

    symbol = str(payload["symbol"]).strip().upper()
    quantity = float(payload["quantity"])
    price = float(payload["price"])
    fees = float(payload.get("fees", 0))

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        total_cost = quantity * price + fees

        # 1️⃣ Insert transaction
        cur.execute("""
            INSERT INTO transactions (user_id, symbol, type, quantity, price, fees)
            VALUES (%s, %s, 'buy', %s, %s, %s)
        """, (user_id, symbol, quantity, price, fees))

        # 2️⃣ Update investments
        cur.execute("""
            SELECT units, cost_basis
            FROM investments
            WHERE user_id = %s AND symbol = %s
        """, (user_id, symbol))

        existing = cur.fetchone()

        if existing:
            new_units = float(existing["units"]) + quantity
            new_cost_basis = float(existing["cost_basis"]) + total_cost
            new_avg_price = new_cost_basis / new_units

            cur.execute("""
                UPDATE investments
                SET units = %s,
                    cost_basis = %s,
                    avg_buy_price = %s
                WHERE user_id = %s AND symbol = %s
            """, (new_units, new_cost_basis, new_avg_price, user_id, symbol))
        else:
            cur.execute("""
                INSERT INTO investments
                (user_id, asset_type, symbol, units, avg_buy_price, cost_basis)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, asset_type, symbol, quantity, price, total_cost))

        conn.commit()
        return {"message": "Buy transaction successful"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# =========================
# SELL ASSET
# =========================
@router.post("/sell")
def sell_asset(
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    symbol = str(payload["symbol"]).strip().upper()
    quantity = float(payload["quantity"])
    price = float(payload["price"])
    fees = float(payload.get("fees", 0))

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT units, cost_basis
            FROM investments
            WHERE user_id = %s AND symbol = %s
        """, (user_id, symbol))

        investment = cur.fetchone()

        if not investment:
            raise HTTPException(status_code=400, detail="No investment found")

        if float(investment["units"]) < quantity:
            raise HTTPException(status_code=400, detail="Insufficient units")

        cur.execute("""
            INSERT INTO transactions (user_id, symbol, type, quantity, price, fees)
            VALUES (%s, %s, 'sell', %s, %s, %s)
        """, (user_id, symbol, quantity, price, fees))

        remaining_units = float(investment["units"]) - quantity

        if remaining_units == 0:
            cur.execute("""
                DELETE FROM investments
                WHERE user_id = %s AND symbol = %s
            """, (user_id, symbol))
        else:
            cost_reduction = (float(investment["cost_basis"]) / float(investment["units"])) * quantity
            new_cost_basis = float(investment["cost_basis"]) - cost_reduction
            new_avg_price = new_cost_basis / remaining_units

            cur.execute("""
                UPDATE investments
                SET units = %s,
                    cost_basis = %s,
                    avg_buy_price = %s
                WHERE user_id = %s AND symbol = %s
            """, (remaining_units, new_cost_basis, new_avg_price, user_id, symbol))

        conn.commit()
        return {"message": "Sell transaction successful"}

    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()


# =========================
# HOLDINGS (READ ONLY)
# =========================
@router.get("/holdings")
def get_portfolio_holdings(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT
                asset_type,
                symbol,
                units,
                avg_buy_price,
                cost_basis
            FROM investments
            WHERE user_id = %s
        """, (user_id,))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


# =========================
# TRANSACTION HISTORY (READ ONLY)
# =========================
@router.get("/transactions")
def get_transaction_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT
                symbol,
                type,
                quantity,
                price,
                fees,
                executed_at
            FROM transactions
            WHERE user_id = %s
            ORDER BY executed_at DESC
        """, (user_id,))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()
