from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import random
import yfinance as yf  # ADDED: To fetch live market data

# ADDED: risk_questions to the import list
from .. import models, schemas, database, auth, risk_questions

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
    # Clean hidden spaces from user input to prevent duplicate rows
    clean_symbol = tx.symbol.upper().strip()
    clean_type = tx.transaction_type.upper().strip()
    
    total_cost = tx.quantity * tx.price_per_unit
    
    new_tx = models.Transaction(
        user_id=current_user.id,
        symbol=clean_symbol,
        transaction_type=clean_type,
        quantity=tx.quantity,
        price_per_unit=tx.price_per_unit,
        total_amount=total_cost
    )
    db.add(new_tx)

    investment = db.query(models.Investment).filter(
        models.Investment.user_id == current_user.id,
        models.Investment.symbol == clean_symbol
    ).first()

    if clean_type == "BUY":
        if not investment:
            from ..market_data import fetch_current_price
            mkt_price = fetch_current_price(clean_symbol) or tx.price_per_unit
            
            investment = models.Investment(
                user_id=current_user.id,
                symbol=clean_symbol,
                asset_type=tx.asset_type,
                quantity=tx.quantity,
                average_buy_price=tx.price_per_unit,
                last_price=mkt_price,
                current_value=tx.quantity * mkt_price
            )
            db.add(investment)
        else:
            old_qty = investment.quantity
            old_avg = investment.average_buy_price
            
            new_qty = old_qty + tx.quantity
            new_avg_cost = ((old_qty * old_avg) + (tx.quantity * tx.price_per_unit)) / new_qty
            
            investment.quantity = new_qty
            investment.average_buy_price = new_avg_cost
            investment.current_value = investment.quantity * (investment.last_price or investment.average_buy_price)

    elif clean_type == "SELL":
        if not investment or investment.quantity < tx.quantity:
            raise HTTPException(status_code=400, detail="Not enough units to sell")
        
        investment.quantity -= tx.quantity
        investment.current_value = investment.quantity * (investment.last_price or investment.average_buy_price)
        
        if investment.quantity == 0:
            db.delete(investment) 
    
    db.commit()
    db.refresh(new_tx)
    return new_tx


# ADDED: Milestone 4 Rebalance Engine with Live yfinance Data
@router.get("/rebalance-suggestions")
def get_rebalance_suggestions(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.profile_completed or not current_user.risk_category:
        return {"status": "error", "message": "Risk profile incomplete.", "suggestions": []}
        
    target_alloc = risk_questions.get_allocation(current_user.risk_category)
    investments = db.query(models.Investment).filter(models.Investment.user_id == current_user.id).all()
    
    if not investments:
        return {"status": "success", "message": "No investments to rebalance.", "suggestions": []}

    current_alloc = {}
    total_value = 0.0
    
    for inv in investments:
        val = inv.current_value or (inv.quantity * inv.last_price)
        total_value += val
        
        # --- SMART OVERRIDE ---
        symbol = inv.symbol.upper().strip()
        if symbol in ["BND", "TLT", "AGG"]:
            asset_type = "Bonds"
        elif symbol in ["BTC", "ETH", "SOL"]:
            asset_type = "Crypto"
        else:
            asset_type = inv.asset_type.capitalize() if inv.asset_type else "Stocks"
            if asset_type == "Stock": asset_type = "Stocks"
            elif asset_type == "Bond": asset_type = "Bonds"
            
        current_alloc[asset_type] = current_alloc.get(asset_type, 0.0) + val
        
    suggestions = []
    
    # --- LIVE DATA SMART PICKER ALGORITHM ---
    def get_smart_picks(asset_category, risk_profile):
        market_database = {
            "Stocks": [
                {"symbol": "NVDA", "name": "NVIDIA Corp.", "risk": "Aggressive"},
                {"symbol": "TSLA", "name": "Tesla Inc.", "risk": "Aggressive"},
                {"symbol": "CRWD", "name": "CrowdStrike", "risk": "Aggressive"},
                {"symbol": "AAPL", "name": "Apple Inc.", "risk": "Moderate"},
                {"symbol": "MSFT", "name": "Microsoft Corp.", "risk": "Moderate"},
                {"symbol": "AMZN", "name": "Amazon.com", "risk": "Moderate"},
                {"symbol": "VOO", "name": "Vanguard S&P 500", "risk": "Conservative"},
                {"symbol": "VTI", "name": "Total Stock Mkt", "risk": "Conservative"},
                {"symbol": "BRK.B", "name": "Berkshire Hathaway", "risk": "Conservative"}
            ],
            "Crypto": [
                {"symbol": "SOL-USD", "name": "Solana", "risk": "Aggressive"},
                {"symbol": "ETH-USD", "name": "Ethereum", "risk": "Moderate"},
                {"symbol": "BTC-USD", "name": "Bitcoin", "risk": "Conservative"}
            ],
            "Bonds": [
                {"symbol": "JNK", "name": "High Yield Corp Bond", "risk": "Aggressive"},
                {"symbol": "LQD", "name": "Corporate Bond ETF", "risk": "Moderate"},
                {"symbol": "BND", "name": "Total Bond Market", "risk": "Conservative"},
                {"symbol": "TLT", "name": "20+ Yr Treasury", "risk": "Conservative"}
            ]
        }
        
        pool = market_database.get(asset_category, [])
        valid_picks = []
        user_risk = risk_profile.lower()

        # Match risk profile
        for asset in pool:
            if "aggressive" in user_risk and asset["risk"] in ["Aggressive", "Moderate"]:
                valid_picks.append(asset)
            elif "moderate" in user_risk and asset["risk"] in ["Moderate", "Conservative"]:
                valid_picks.append(asset)
            elif "conservative" in user_risk and asset["risk"] == "Conservative":
                valid_picks.append(asset)
                
        if not valid_picks:
            valid_picks = pool

        tickers = [asset["symbol"] for asset in valid_picks]
        
        try:
            # 1. Fetch live 5-day historical data from Yahoo Finance
            data = yf.download(tickers, period="5d", progress=False)["Close"]
            
            performance = []
            for asset in valid_picks:
                sym = asset["symbol"]
                try:
                    # 2. Calculate the live percentage change (Momentum)
                    if len(tickers) > 1:
                        past_price = float(data[sym].iloc[0])
                        current_price = float(data[sym].iloc[-1])
                    else:
                        past_price = float(data.iloc[0])
                        current_price = float(data.iloc[-1])
                        
                    pct_change = ((current_price - past_price) / past_price) * 100
                    
                    # Clean up crypto tickers for the frontend display
                    display_sym = sym.replace("-USD", "")
                    
                    performance.append({
                        "symbol": display_sym, 
                        "name": asset["name"], 
                        "momentum": pct_change
                    })
                except Exception:
                    continue
            
            # 3. Sort by highest momentum (best performing right now)
            performance.sort(key=lambda x: x["momentum"], reverse=True)
            
            # Return the top 3 winners
            return [{"symbol": p["symbol"], "name": p["name"]} for p in performance[:3]]
            
        except Exception as e:
            # Fallback to random if Yahoo Finance fails or user is offline
            selected = random.sample(valid_picks, min(3, len(valid_picks)))
            return [{"symbol": a["symbol"].replace("-USD", ""), "name": a["name"]} for a in selected]
    # ----------------------------------

    for asset_type, target_pct in target_alloc.items():
        try:
            clean_target = float(str(target_pct).replace('%', '').strip())
        except ValueError:
            clean_target = 0.0

        target_value = total_value * (clean_target / 100.0)
        actual_value = current_alloc.get(asset_type, 0.0)
        drift_amount = target_value - actual_value
        
        if abs(drift_amount) > 50: 
            action = "BUY" if drift_amount > 0 else "SELL"
            
            sug_data = {
                "asset": asset_type,
                "action": action,
                "amount": round(abs(drift_amount), 2),
                "current_pct": round((actual_value / total_value) * 100, 1) if total_value > 0 else 0,
                "target_pct": clean_target
            }
            
            if action == "BUY":
                sug_data["top_picks"] = get_smart_picks(asset_type, current_user.risk_category)
                
            suggestions.append(sug_data)
            
    suggestions.sort(key=lambda x: 0 if x["action"] == "SELL" else 1)
            
    return {
        "status": "success",
        "total_portfolio_value": round(total_value, 2),
        "suggestions": suggestions
    }