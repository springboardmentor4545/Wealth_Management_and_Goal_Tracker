# backend/app/portfolio.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from decimal import Decimal
from datetime import datetime
from typing import Dict, List, Optional
import logging

from .database import get_db
from .auth import get_current_user
from . import models, schemas
from .market_data import get_current_price, get_multiple_prices

logger = logging.getLogger(__name__)
# --- Portfolio Calculation Utilities ---
def calculate_portfolio_derived(investment, transactions=None):
    """
    Calculate units held, cost basis, and average buy price for an investment
    using its transactions (buy/sell).
    
    Args:
        investment: Investment model instance
        transactions: Optional preloaded transactions list to avoid N+1 queries
    """
    if transactions is None:
        # Fallback to querying if not provided (less efficient)
        logger.warning(f"No preloaded transactions for investment {investment.id}, falling back to query")
        from sqlalchemy.orm import sessionmaker
        from .database import engine
        SessionLocal = sessionmaker(bind=engine)
        with SessionLocal() as db:
            transactions = db.query(models.Transaction).filter_by(
                investment_id=investment.id
            ).order_by(models.Transaction.created_at).all()
    
    total_units = sum(
        tx.quantity if tx.transaction_type == models.TransactionTypeEnum.buy else -tx.quantity 
        for tx in transactions
    )
    total_cost = sum(
        (tx.quantity * tx.price) if tx.transaction_type == models.TransactionTypeEnum.buy else 0 
        for tx in transactions
    )
    total_buys = sum(
        tx.quantity for tx in transactions 
        if tx.transaction_type == models.TransactionTypeEnum.buy
    )
    avg_buy_price = (total_cost / total_buys) if total_buys > 0 else 0
    
    return {
        "units_held": total_units,
        "cost_basis": total_cost,
        "average_buy_price": avg_buy_price
    }


def bulk_calculate_portfolio_derived(investments_with_transactions: List[tuple]) -> Dict[int, dict]:
    """
    Calculate portfolio metrics for multiple investments efficiently.
    
    Args:
        investments_with_transactions: List of (investment, transactions_list) tuples
        
    Returns:
        Dict mapping investment_id to calculated metrics
    """
    results = {}
    
    for investment, transactions in investments_with_transactions:
        results[investment.id] = calculate_portfolio_derived(investment, transactions)
    
    return results
from .market_data import get_current_price
from .tasks import update_user_prices

router = APIRouter(
    prefix="/portfolio",
    tags=["Portfolio"]
)

# ----------------------------------------------------
# BUY / SELL TRANSACTION (No edit/delete allowed for txns) #
# ----------------------------------------------------
@router.post("/transaction", response_model=schemas.InvestmentResponse)
def create_transaction(
    payload: schemas.TransactionCreateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """
    Create a buy or sell transaction. Transactions cannot be edited or deleted.
    Investments are automatically updated based on transactions.
    """
    if payload.quantity <= 0 or payload.price <= 0:
        raise HTTPException(status_code=400, detail="Invalid quantity or price")

    tx_type = payload.transaction_type.lower()
    if tx_type not in ("buy", "sell"):
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    investment = db.query(models.Investment).filter_by(
        user_id=user.id,
        asset_name=payload.asset_name,
        asset_type=payload.asset_type
    ).first()

    # ---------------- BUY ----------------
    if tx_type == "buy":
        if not investment:
            investment = models.Investment(
                user_id=user.id,
                asset_name=payload.asset_name,
                asset_type=payload.asset_type,
                symbol=payload.asset_name,
                total_quantity=Decimal("0"),
                average_price=Decimal("0"),
            )
            db.add(investment)
            db.flush()
        elif not investment.symbol:
            investment.symbol = payload.asset_name

        total_cost = investment.total_quantity * investment.average_price
        buy_cost = payload.quantity * payload.price
        new_qty = investment.total_quantity + payload.quantity

        investment.average_price = (total_cost + buy_cost) / new_qty
        investment.total_quantity = new_qty

    # ---------------- SELL ----------------
    else:
        if not investment or investment.total_quantity < payload.quantity:
            raise HTTPException(status_code=400, detail="Insufficient quantity to sell")

        investment.total_quantity -= payload.quantity
        if investment.total_quantity == 0:
            investment.average_price = Decimal("0")

    # Always create a new transaction, never update/delete
    transaction = models.Transaction(
        investment_id=investment.id,
        user_id=user.id,
        transaction_type=tx_type,
        quantity=payload.quantity,
        price=payload.price,
    )

    db.add(transaction)
    db.commit()
    db.refresh(investment)

    # Get transactions for this investment efficiently
    transactions = db.query(models.Transaction).filter_by(
        investment_id=investment.id
    ).order_by(models.Transaction.created_at).all()

    # Compose response dict with all required fields for InvestmentResponse
    derived = calculate_portfolio_derived(investment, transactions)
    last_price, day_change = (None, None)
    if investment.symbol:
        last_price, day_change = get_current_price(investment.symbol)
    
    inv_dict = {**{c.name: getattr(investment, c.name) for c in investment.__table__.columns}, **derived}
    if hasattr(investment, 'symbol'):
        inv_dict['symbol'] = investment.symbol
    inv_dict['last_price'] = last_price if last_price is not None else investment.last_price
    inv_dict['day_change'] = day_change
    # Ensure all required fields are present
    return schemas.InvestmentResponse(**inv_dict)

# No endpoints for editing or deleting transactions are provided, ensuring immutability.

# ----------------------------------------------------
# LIST PORTFOLIO
# ----------------------------------------------------
@router.get("", response_model=list[schemas.InvestmentResponse])
def list_portfolio(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """
    Get user's portfolio with optimized queries to avoid N+1 problems.
    """
    # Use eager loading to fetch investments with their transactions in one query
    investments = db.query(models.Investment).filter(
        models.Investment.user_id == user.id
    ).options(
        selectinload(models.Investment.transactions)
    ).all()
    
    if not investments:
        return []
    
    # Collect all unique symbols for bulk price fetching
    symbols = []
    symbol_to_investments = {}
    
    for inv in investments:
        if inv.symbol and inv.symbol.strip():
            if inv.symbol not in symbol_to_investments:
                symbols.append(inv.symbol)
                symbol_to_investments[inv.symbol] = []
            symbol_to_investments[inv.symbol].append(inv)
    
    # Fetch all prices at once if we have symbols
    prices_data = {}
    if symbols:
        logger.info(f"Fetching prices for {len(symbols)} unique symbols for user {user.id}")
        prices_data = get_multiple_prices(symbols)
    
    # Build response efficiently
    result = []
    for inv in investments:
        # Use preloaded transactions (no additional query)
        transactions = inv.transactions if hasattr(inv, 'transactions') else []
        derived = calculate_portfolio_derived(inv, transactions)
        
        # Get price data from bulk fetch
        last_price, day_change = (None, None)
        if inv.symbol and inv.symbol in prices_data:
            last_price, day_change = prices_data[inv.symbol]
        
        # Build response dict
        inv_dict = {**{c.name: getattr(inv, c.name) for c in inv.__table__.columns}, **derived}
        if hasattr(inv, 'symbol'):
            inv_dict['symbol'] = inv.symbol
        inv_dict['last_price'] = last_price if last_price is not None else inv.last_price
        inv_dict['day_change'] = day_change
        
        inv_data = schemas.InvestmentResponse(**inv_dict)
        result.append(inv_data)
    
    logger.info(f"Successfully processed portfolio for user {user.id} with {len(result)} investments")
    return result


@router.get("/transactions", response_model=list[schemas.TransactionResponse])
def list_transactions(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rows = (
        db.query(models.Transaction, models.Investment)
        .join(
            models.Investment,
            models.Transaction.investment_id == models.Investment.id,
        )
        .filter(models.Transaction.user_id == user.id)
        .order_by(models.Transaction.created_at.desc())
        .all()
    )

    return [
        {
            "id": tx.id,
            "transaction_type": tx.transaction_type,
            "quantity": tx.quantity,
            "price": tx.price,
            "created_at": tx.created_at,
        }
        for tx, inv in rows
    ]


# ----------------------------------------------------
# PORTFOLIO SUMMARY (Live Valuation)
# ----------------------------------------------------
@router.get("/summary", response_model=schemas.PortfolioSummaryResponse)
def portfolio_summary(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """
    Get portfolio summary with optimized queries.
    """
    # Use eager loading to fetch investments with their transactions
    investments = db.query(models.Investment).filter(
        models.Investment.user_id == user.id
    ).options(
        selectinload(models.Investment.transactions)
    ).all()

    if not investments:
        return {
            "total_value": Decimal("0"),
            "last_price_updated_at": None,
        }

    total_value = Decimal("0")
    last_updated = None

    # Process each investment efficiently
    for inv in investments:
        # Use preloaded transactions
        transactions = inv.transactions if hasattr(inv, 'transactions') else []
        derived = calculate_portfolio_derived(inv, transactions)
        
        # Calculate value based on available data
        if inv.current_value is not None:
            total_value += inv.current_value
        elif inv.last_price is not None:
            total_value += derived["units_held"] * inv.last_price

        # Track latest price update
        if inv.last_price_updated_at:
            if last_updated is None or inv.last_price_updated_at > last_updated:
                last_updated = inv.last_price_updated_at

    logger.info(f"Portfolio summary calculated for user {user.id}: total_value={total_value}, last_updated={last_updated}")
    
    return {
        "total_value": total_value,
        "last_price_updated_at": last_updated,
    }

# ----------------------------------------------------
# UPDATE INVESTMENT PRICES (from Yahoo Finance)
# ----------------------------------------------------
@router.post("/update-prices")
def update_investment_prices(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Queue a background job to update current prices for all user investments"""
    task = update_user_prices.delay(user.id)

    return {
        "message": "Price update queued",
        "task_id": task.id,
    }


@router.get("/price/{symbol}")
def get_price(symbol: str):
    """Get current price for a specific symbol"""
    try:
        price = get_current_price(symbol)
        if not price:
            raise HTTPException(status_code=404, detail=f"No data for symbol: {symbol}")
        return {
            "symbol": symbol,
            "last_price": price,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch price: {str(e)}")