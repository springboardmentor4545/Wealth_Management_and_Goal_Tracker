from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Investment, Transaction, TransactionTypeEnum
from ..schemas import TransactionCreate, TransactionOut, InvestmentOut
from ..deps import get_current_user
from decimal import Decimal
from datetime import datetime

router = APIRouter(tags=["Portfolio"])


# ---------------- BUY / SELL ----------------
@router.post("/transaction", response_model=TransactionOut)
def add_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    txn = Transaction(
        user_id=user.id,
        symbol=payload.symbol,
        type=payload.type,
        quantity=payload.quantity,
        price=payload.price,
        fees=payload.fees,
        executed_at=payload.executed_at or datetime.utcnow(),
    )
    db.add(txn)

    investment = (
        db.query(Investment)
        .filter(
            Investment.user_id == user.id,
            Investment.symbol == payload.symbol,
        )
        .first()
    )

    if not investment:
        investment = Investment(
            user_id=user.id,
            symbol=payload.symbol,
            asset_type=payload.asset_type,
            units=Decimal("0"),
            cost_basis=Decimal("0"),
            avg_buy_price=Decimal("0"),
            current_value=Decimal("0"),
            last_price=Decimal("0"),
            last_price_at=None,
        )
        db.add(investment)

    qty = Decimal(payload.quantity)
    price = Decimal(payload.price)

    
    if payload.type == TransactionTypeEnum.buy:
        investment.cost_basis += qty * price
        investment.units += qty

    
    elif payload.type == TransactionTypeEnum.sell:
        if investment.units < qty:
            raise HTTPException(status_code=400, detail="Insufficient units")

        investment.cost_basis -= investment.avg_buy_price * qty
        investment.units -= qty

    
    if investment.units > 0:
        investment.avg_buy_price = investment.cost_basis / investment.units
        investment.last_price = price
        investment.last_price_at = txn.executed_at
        investment.current_value = investment.units * investment.last_price
    else:
        
        investment.avg_buy_price = Decimal("0")
        investment.cost_basis = Decimal("0")
        investment.current_value = Decimal("0")
        investment.last_price = price
        investment.last_price_at = txn.executed_at

    db.commit()
    db.refresh(txn)
    return txn



# ---------------- HOLDINGS ----------------
@router.get("/holdings", response_model=list[InvestmentOut])
def get_holdings(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return (
        db.query(Investment)
        .filter(Investment.user_id == user.id, Investment.units > 0)
        .all()
    )


# ---------------- TRANSACTION HISTORY ----------------
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
