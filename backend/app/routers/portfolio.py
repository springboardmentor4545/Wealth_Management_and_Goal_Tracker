from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(
    prefix="/portfolio",
    tags=["portfolio"]
)

@router.get("/holdings", response_model=List[schemas.InvestmentOut])
def get_holdings(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    investments = db.query(models.Investment).filter(models.Investment.user_id == current_user.id).all()
    
    # Trigger a background update for this user's prices
    # This ensures next time they refresh, it's very fresh, without slowing down THIS request.
    from ..celery_app import update_user_prices_async
    try:
        update_user_prices_async.delay(current_user.id)
    except Exception:
        # If celery/redis is not running, just skip background update
        pass

    return investments

@router.get("/transactions", response_model=List[schemas.TransactionOut])
def get_transactions(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Transaction)\
        .filter(models.Transaction.user_id == current_user.id)\
        .order_by(models.Transaction.date.desc())\
        .all()

@router.post("/transaction", response_model=schemas.TransactionOut)
def create_transaction(tx: schemas.TransactionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # 1. Create Transaction Record
    total_cost = tx.quantity * tx.price_per_unit
    
    new_tx = models.Transaction(
        user_id=current_user.id,
        symbol=tx.symbol.upper(),
        transaction_type=tx.transaction_type.upper(),
        quantity=tx.quantity,
        price_per_unit=tx.price_per_unit,
        total_amount=total_cost
    )
    db.add(new_tx)

    # 2. Update Investment Portfolio Logic
    investment = db.query(models.Investment).filter(
        models.Investment.user_id == current_user.id,
        models.Investment.symbol == tx.symbol.upper()
    ).first()

    if tx.transaction_type.upper() == "BUY":
        if not investment:
            # Fetch current market price for metadata
            from ..market_data import fetch_current_price
            mkt_price = fetch_current_price(tx.symbol.upper()) or tx.price_per_unit
            
            # Create new investment holding
            investment = models.Investment(
                user_id=current_user.id,
                symbol=tx.symbol.upper(),
                asset_type=tx.asset_type,
                quantity=tx.quantity,
                average_buy_price=tx.price_per_unit,
                last_price=mkt_price,
                current_value=tx.quantity * mkt_price
            )
            db.add(investment)
        else:
            # Update existing holding: Weighted Average Cost
            # Old Total Cost + New Cost / New Total Quantity
            old_qty = investment.quantity
            old_avg = investment.average_buy_price
            
            new_qty = old_qty + tx.quantity
            new_avg_cost = ((old_qty * old_avg) + (tx.quantity * tx.price_per_unit)) / new_qty
            
            investment.quantity = new_qty
            investment.average_buy_price = new_avg_cost
            investment.current_value = investment.quantity * (investment.last_price or investment.average_buy_price)

    elif tx.transaction_type.upper() == "SELL":
        if not investment or investment.quantity < tx.quantity:
            raise HTTPException(status_code=400, detail="Not enough units to sell")
        
        # Determine profit/loss logic here if needed, but for now just reduce quantity
        investment.quantity -= tx.quantity
        investment.current_value = investment.quantity * (investment.last_price or investment.average_buy_price)
        
        if investment.quantity == 0:
            db.delete(investment) 
            # actually better to keep it with 0 to track history, but users prefer clean lists.
            # Let's check quantity
    
    db.commit()
    db.refresh(new_tx)
    return new_tx
