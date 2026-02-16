from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

from ..database import get_db
from ..models import Investment, Transaction, TransactionTypeEnum
from ..schemas import TransactionCreate, TransactionOut, InvestmentOut
from ..deps import get_current_user
from app.services.market_data import fetch_latest_price

router = APIRouter(tags=["Portfolio"])


# ---------------- ADD TRANSACTION ----------------
@router.post("/transaction", response_model=TransactionOut)
def add_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    qty = Decimal(str(payload.quantity))
    price = Decimal(str(payload.price))
    fees = Decimal(str(payload.fees or 0))
    now = payload.executed_at or datetime.utcnow()

    txn = Transaction(
        user_id=user.id,
        symbol=payload.symbol.upper(),
        type=payload.type,
        quantity=qty,
        price=price,
        fees=fees,
        executed_at=now,
    )
    db.add(txn)

    investment = (
        db.query(Investment)
        .filter(
            Investment.user_id == user.id,
            Investment.symbol == payload.symbol.upper(),
        )
        .first()
    )

    if not investment:
        investment = Investment(
            user_id=user.id,
            symbol=payload.symbol.upper(),
            asset_type=payload.asset_type,
            units=Decimal("0"),
            cost_basis=Decimal("0"),
            avg_buy_price=Decimal("0"),
            current_value=Decimal("0"),
        )
        db.add(investment)

    # ---------- BUY ----------
    if payload.type == TransactionTypeEnum.buy:
        investment.cost_basis += (qty * price) + fees
        investment.units += qty
        investment.avg_buy_price = (
            investment.cost_basis / investment.units
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # ---------- SELL ----------
    elif payload.type == TransactionTypeEnum.sell:
        if investment.units < qty:
            raise HTTPException(status_code=400, detail="Insufficient units")

        investment.cost_basis -= investment.avg_buy_price * qty
        investment.units -= qty

    # ---------- UPDATE CURRENT VALUE ----------
    if investment.units > 0:
        investment.last_price = price
        investment.last_price_updated_at = now
        investment.current_value = (
            investment.units * price
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    else:
        investment.units = Decimal("0")
        investment.cost_basis = Decimal("0")
        investment.avg_buy_price = Decimal("0")
        investment.current_value = Decimal("0")
        investment.last_price = None
        investment.last_price_updated_at = None

    db.commit()
    db.refresh(txn)
    return txn


# ---------------- HOLDINGS ----------------
@router.get("/holdings", response_model=list[InvestmentOut])
def get_holdings(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    investments = (
        db.query(Investment)
        .filter(
            Investment.user_id == user.id,
            Investment.units > 0,
        )
        .all()
    )

    for inv in investments:
        units = inv.units or Decimal("0")
        avg_price = inv.avg_buy_price or Decimal("0")
        current_value = inv.current_value or Decimal("0")

        buy_value = (units * avg_price).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        inv.profit_loss = (current_value - buy_value).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        inv.profit_loss_percent = (
            (inv.profit_loss / buy_value) * 100
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) if buy_value > 0 else Decimal("0")

    return investments


# ---------------- TRANSACTIONS ----------------
@router.get("/transactions", response_model=list[TransactionOut])
def get_transactions(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.executed_at.desc())
        .all()
    )


# ---------------- LIVE MARKET DATA ----------------
@router.get("/market/live")
def get_live_market_data(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    investments = (
        db.query(Investment)
        .filter(Investment.user_id == user.id)
        .all()
    )

    live_data = []

    for inv in investments:
        live_price = fetch_latest_price(inv.symbol)

        
        if live_price is None:
            live_price = inv.last_price

        if live_price:
            inv.last_price = live_price
            inv.last_price_updated_at = datetime.utcnow()
            inv.current_value = (inv.units * live_price).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        live_data.append({
            "symbol": inv.symbol,
            "units": float(inv.units),
            "live_price": float(live_price) if live_price else None,
            "live_value": float(inv.current_value) if inv.current_value else None,
        })

    db.commit()
    return live_data
