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
    
    # Calculate current value (Static for now, can be connected to real API later)
    # logic: current_value = quantity * (average_buy_price * random_variation_factor)
    # For now, let's just assume current price = average buy price for simplicity unless we attach a mock market price
    for inv in investments:
        # We attach the 'current_value' to the object for the schema to pick up
        # Value = Quantity * Price
        inv.current_value = inv.quantity * inv.average_buy_price 

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
            # Create new investment holding
            investment = models.Investment(
                user_id=current_user.id,
                symbol=tx.symbol.upper(),
                asset_type=tx.asset_type,
                quantity=tx.quantity,
                average_buy_price=tx.price_per_unit
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

    elif tx.transaction_type.upper() == "SELL":
        if not investment or investment.quantity < tx.quantity:
            raise HTTPException(status_code=400, detail="Not enough units to sell")
        
        # Determine profit/loss logic here if needed, but for now just reduce quantity
        investment.quantity -= tx.quantity
        if investment.quantity == 0:
            db.delete(investment) # Remove holding if sold out? Or keep with 0? Let's keep with 0 usually, but deleting is cleaner for the list.
            # actually better to keep it with 0 to track history, but users prefer clean lists.
            # Let's check quantity
    
    db.commit()
    db.refresh(new_tx)
    return new_tx
