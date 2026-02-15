from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from database import get_db_connection
from routes.auth import get_current_user
from services.market_data import market_service
from decimal import Decimal

router = APIRouter(
    prefix="/portfolio",
    tags=["Portfolio"]
)

# =========================
# REQUEST SCHEMAS
# =========================

class TransactionCreate(BaseModel):
    symbol: str
    type: str  # 'buy' or 'sell'
    quantity: float
    price: float
    fees: Optional[float] = 0


class TransactionResponse(BaseModel):
    id: int
    symbol: str
    type: str
    quantity: float
    price: float
    fees: float
    total_value: float
    executed_at: str


class HoldingResponse(BaseModel):
    symbol: str
    units_held: float
    avg_buy_price: float
    cost_basis: float
    current_value: float
    last_price: Optional[float] = None
    last_price_updated_at: Optional[str] = None
    profit_loss: float
    profit_loss_percentage: float


# =========================
# HELPER FUNCTIONS
# =========================

def format_symbol_for_market(symbol: str) -> str:
    """
    Convert database symbol to Yahoo Finance format
    
    Examples:
        'TCS' -> 'TCS.NS'
        'RELIANCE' -> 'RELIANCE.NS'
        'AAPL' -> 'AAPL' (unchanged for US stocks)
    """
    symbol = symbol.upper().strip()
    
    # If already has an exchange suffix, return as-is
    if '.' in symbol:
        return symbol
    
    # List of common Indian stock symbols (you can expand this)
    INDIAN_SYMBOLS = [
        'TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'ICICIBANK', 
        'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT',
        'HINDUNILVR', 'BAJFINANCE', 'ASIANPAINT', 'MARUTI', 'TITAN',
        'AXISBANK', 'WIPRO', 'ULTRACEMCO', 'SUNPHARMA', 'NESTLEIND'
    ]
    
    # For Indian symbols, append .NS (NSE)
    if symbol in INDIAN_SYMBOLS:
        return f"{symbol}.NS"
    
    # For unknown symbols, try .NS first (most common in India)
    # If that fails, market_service will handle the error
    # You can also try .BO (BSE) as fallback
    return f"{symbol}.NS"


def calculate_holdings(user_id: int, conn, include_market_prices: bool = True):
    """Calculate current holdings from all transactions"""
    cur = conn.cursor()
    
    # Get all transactions for the user
    cur.execute("""
        SELECT symbol, type, quantity, price, fees
        FROM transactions
        WHERE user_id = %s
        ORDER BY executed_at ASC
    """, (user_id,))
    
    transactions = cur.fetchall()
    holdings = {}
    
    for txn in transactions:
        symbol = txn['symbol']
        txn_type = txn['type']
        quantity = float(txn['quantity'])
        price = float(txn['price'])
        fees = float(txn['fees'])
        
        if symbol not in holdings:
            holdings[symbol] = {
                'units': 0,
                'total_cost': 0,
                'total_fees': 0
            }
        
        if txn_type == 'buy':
            # Add to holdings
            holdings[symbol]['units'] += quantity
            holdings[symbol]['total_cost'] += (quantity * price)
            holdings[symbol]['total_fees'] += fees
        elif txn_type == 'sell':
            # Reduce holdings
            if holdings[symbol]['units'] < quantity:
                raise ValueError(f"Insufficient units to sell for {symbol}")
            
            # Calculate proportional cost reduction
            avg_cost = holdings[symbol]['total_cost'] / holdings[symbol]['units'] if holdings[symbol]['units'] > 0 else 0
            cost_reduction = quantity * avg_cost
            
            holdings[symbol]['units'] -= quantity
            holdings[symbol]['total_cost'] -= cost_reduction
            holdings[symbol]['total_fees'] += fees
    
    # Remove holdings with 0 units
    holdings = {k: v for k, v in holdings.items() if v['units'] > 0}
    
    # Fetch current market prices if requested
    market_prices = {}
    if include_market_prices and holdings:
        # Convert symbols to market format (TCS -> TCS.NS)
        symbol_mapping = {}
        market_symbols = []
        
        for db_symbol in holdings.keys():
            market_symbol = format_symbol_for_market(db_symbol)
            symbol_mapping[market_symbol] = db_symbol
            market_symbols.append(market_symbol)
        
        print(f"🔄 Fetching prices for: {market_symbols}")
        
        try:
            # Fetch prices with market-formatted symbols
            raw_prices = market_service.get_multiple_prices(market_symbols)
            
            # Map back to database symbols
            for market_symbol, price_data in raw_prices.items():
                db_symbol = symbol_mapping[market_symbol]
                market_prices[db_symbol] = price_data
            
            print(f"✅ Fetched market prices for {len(market_prices)} symbols")
            print(f"📊 Prices: {[(k, v['price']) for k, v in market_prices.items()]}")
            
        except Exception as e:
            print(f"⚠️ Could not fetch market prices: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Calculate averages and current values
    result = []
    for symbol, data in holdings.items():
        avg_buy_price = data['total_cost'] / data['units'] if data['units'] > 0 else 0
        cost_basis = data['total_cost'] + data['total_fees']
        
        # Use market price if available, otherwise use cost basis
        if symbol in market_prices:
            market_data = market_prices[symbol]
            current_price = market_data['price']
            current_value = data['units'] * current_price
            last_price_updated_at = market_data['timestamp'].isoformat()
            
            print(f"✅ {symbol}: ₹{current_price:.2f} (market price)")
        else:
            current_price = None
            current_value = cost_basis  # Fallback to cost basis
            last_price_updated_at = None
            
            print(f"⚠️ {symbol}: No market price available, using cost basis")
        
        profit_loss = current_value - cost_basis
        profit_loss_percentage = (profit_loss / cost_basis * 100) if cost_basis > 0 else 0
        
        result.append({
            'symbol': symbol,
            'units_held': round(data['units'], 4),
            'avg_buy_price': round(avg_buy_price, 2),
            'cost_basis': round(cost_basis, 2),
            'current_value': round(current_value, 2),
            'last_price': round(current_price, 2) if current_price else None,
            'last_price_updated_at': last_price_updated_at,
            'profit_loss': round(profit_loss, 2),
            'profit_loss_percentage': round(profit_loss_percentage, 2)
        })
    
    cur.close()
    return result


# =========================
# BUY TRANSACTION
# =========================

@router.post("/buy")
def buy_asset(
    transaction: TransactionCreate,
    user=Depends(get_current_user)
):
    conn = None
    cur = None
    
    try:
        if transaction.type != 'buy':
            raise HTTPException(status_code=400, detail="Transaction type must be 'buy'")
        
        if transaction.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        
        if transaction.price <= 0:
            raise HTTPException(status_code=400, detail="Price must be positive")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert transaction
        cur.execute("""
            INSERT INTO transactions (
                user_id, symbol, type, quantity, price, fees, executed_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (
            user['id'],
            transaction.symbol.upper(),
            'buy',
            transaction.quantity,
            transaction.price,
            transaction.fees
        ))
        
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create transaction")
        
        transaction_id = result['id']
        conn.commit()
        
        print(f"✅ Buy transaction created: ID {transaction_id}")
        
        return {
            "message": "Buy transaction successful",
            "transaction_id": transaction_id,
            "total_cost": (transaction.quantity * transaction.price) + transaction.fees
        }
        
    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ BUY ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process buy transaction: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# SELL TRANSACTION
# =========================

@router.post("/sell")
def sell_asset(
    transaction: TransactionCreate,
    user=Depends(get_current_user)
):
    conn = None
    cur = None
    
    try:
        if transaction.type != 'sell':
            raise HTTPException(status_code=400, detail="Transaction type must be 'sell'")
        
        if transaction.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        
        if transaction.price <= 0:
            raise HTTPException(status_code=400, detail="Price must be positive")
        
        conn = get_db_connection()
        
        # Check if user has enough units to sell
        holdings = calculate_holdings(user['id'], conn, include_market_prices=False)
        symbol_holding = next((h for h in holdings if h['symbol'] == transaction.symbol.upper()), None)
        
        if not symbol_holding:
            raise HTTPException(status_code=400, detail=f"You don't own any {transaction.symbol}")
        
        if symbol_holding['units_held'] < transaction.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient units. You have {symbol_holding['units_held']} but trying to sell {transaction.quantity}"
            )
        
        cur = conn.cursor()
        
        # Insert sell transaction
        cur.execute("""
            INSERT INTO transactions (
                user_id, symbol, type, quantity, price, fees, executed_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (
            user['id'],
            transaction.symbol.upper(),
            'sell',
            transaction.quantity,
            transaction.price,
            transaction.fees
        ))
        
        result = cur.fetchone()
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create transaction")
        
        transaction_id = result['id']
        conn.commit()
        
        print(f"✅ Sell transaction created: ID {transaction_id}")
        
        return {
            "message": "Sell transaction successful",
            "transaction_id": transaction_id,
            "total_received": (transaction.quantity * transaction.price) - transaction.fees
        }
        
    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ SELL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process sell transaction: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# GET HOLDINGS (NOW WITH LIVE PRICES!)
# =========================

@router.get("/holdings", response_model=List[HoldingResponse])
def get_holdings(user=Depends(get_current_user)):
    conn = None
    
    try:
        conn = get_db_connection()
        holdings = calculate_holdings(user['id'], conn, include_market_prices=True)
        
        print(f"✅ Fetched {len(holdings)} holdings for user {user['id']}")
        return holdings
        
    except Exception as e:
        print(f"❌ GET HOLDINGS ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch holdings")
    finally:
        if conn:
            conn.close()


# =========================
# GET TRANSACTIONS
# =========================

@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(user=Depends(get_current_user)):
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                id, symbol, type, quantity, price, fees, executed_at
            FROM transactions
            WHERE user_id = %s
            ORDER BY executed_at DESC
        """, (user['id'],))
        
        rows = cur.fetchall()
        
        transactions = []
        for r in rows:
            total_value = (float(r['quantity']) * float(r['price']))
            if r['type'] == 'buy':
                total_value += float(r['fees'])
            else:
                total_value -= float(r['fees'])
            
            transactions.append({
                'id': r['id'],
                'symbol': r['symbol'],
                'type': r['type'],
                'quantity': float(r['quantity']),
                'price': float(r['price']),
                'fees': float(r['fees']),
                'total_value': round(total_value, 2),
                'executed_at': r['executed_at'].isoformat()
            })
        
        print(f"✅ Fetched {len(transactions)} transactions for user {user['id']}")
        return transactions
        
    except Exception as e:
        print(f"❌ GET TRANSACTIONS ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# =========================
# GET PORTFOLIO SUMMARY (NOW WITH LIVE PRICES!)
# =========================

@router.get("/summary")
def get_portfolio_summary(user=Depends(get_current_user)):
    conn = None
    
    try:
        conn = get_db_connection()
        holdings = calculate_holdings(user['id'], conn, include_market_prices=True)
        
        total_invested = sum(h['cost_basis'] for h in holdings)
        total_current_value = sum(h['current_value'] for h in holdings)
        total_profit_loss = total_current_value - total_invested
        
        return {
            "total_invested": round(total_invested, 2),
            "current_value": round(total_current_value, 2),
            "profit_loss": round(total_profit_loss, 2),
            "profit_loss_percentage": round((total_profit_loss / total_invested * 100) if total_invested > 0 else 0, 2),
            "total_assets": len(holdings)
        }
        
    except Exception as e:
        print(f"❌ GET SUMMARY ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch portfolio summary")
    finally:
        if conn:
            conn.close()