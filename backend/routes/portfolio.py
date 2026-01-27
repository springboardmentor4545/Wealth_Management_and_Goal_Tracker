from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from database import get_db_connection
from routes.auth import get_current_user
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
    profit_loss: float
    profit_loss_percentage: float


# =========================
# HELPER FUNCTIONS
# =========================

def calculate_holdings(user_id: int, conn):
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
    
    # Calculate averages
    result = []
    for symbol, data in holdings.items():
        avg_buy_price = data['total_cost'] / data['units'] if data['units'] > 0 else 0
        cost_basis = data['total_cost'] + data['total_fees']
        
        result.append({
            'symbol': symbol,
            'units_held': round(data['units'], 4),
            'avg_buy_price': round(avg_buy_price, 2),
            'cost_basis': round(cost_basis, 2),
            'current_value': round(data['total_cost'], 2),  # Static for now
            'profit_loss': 0,  # Will calculate with real-time prices later
            'profit_loss_percentage': 0
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
        holdings = calculate_holdings(user['id'], conn)
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
# GET HOLDINGS
# =========================

@router.get("/holdings", response_model=List[HoldingResponse])
def get_holdings(user=Depends(get_current_user)):
    conn = None
    
    try:
        conn = get_db_connection()
        holdings = calculate_holdings(user['id'], conn)
        
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
# GET PORTFOLIO SUMMARY
# =========================

@router.get("/summary")
def get_portfolio_summary(user=Depends(get_current_user)):
    conn = None
    
    try:
        conn = get_db_connection()
        holdings = calculate_holdings(user['id'], conn)
        
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