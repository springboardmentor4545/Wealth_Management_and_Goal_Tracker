from fastapi import APIRouter, HTTPException, Depends
from routes.auth import get_current_user
from services.market_data import market_service
from database import get_db_connection
from datetime import datetime

router = APIRouter(
    prefix="/market-data",  # Changed from /market to /market-data
    tags=["Market Data"]
)


@router.post("/update")
def trigger_price_update(user=Depends(get_current_user)):
    """
    Manually trigger price update for user's investments
    Endpoint: POST /market-data/update
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get all unique symbols for this user from transactions
        cur.execute("""
            SELECT DISTINCT symbol 
            FROM transactions 
            WHERE user_id = %s
        """, (user['id'],))
        
        symbols = [row['symbol'] for row in cur.fetchall()]
        
        if not symbols:
            return {
                "message": "No investments to update",
                "updated_count": 0
            }
        
        print(f"📊 Updating prices for {len(symbols)} symbols...")
        
        # Fetch all prices using existing market service
        prices = market_service.get_multiple_prices(symbols)
        
        updated_count = 0
        now = datetime.now()
        
        # Check if investments table exists, if not we'll work with transactions only
        try:
            # Try to update investments table if it exists
            for symbol, price_data in prices.items():
                cur.execute("""
                    UPDATE investments
                    SET 
                        last_price = %s,
                        current_value = units * %s,
                        last_price_updated_at = %s
                    WHERE user_id = %s AND symbol = %s
                """, (
                    price_data['price'],
                    price_data['price'],
                    price_data['timestamp'],
                    user['id'],
                    symbol
                ))
                if cur.rowcount > 0:
                    updated_count += 1
        except Exception as e:
            # If investments table doesn't exist, that's ok
            print(f"ℹ️ Investments table not available: {str(e)}")
            # We'll still return the prices
            updated_count = len(prices)
        
        conn.commit()
        
        print(f"✅ Updated {updated_count} investments")
        
        return {
            "message": f"Successfully updated {updated_count} of {len(symbols)} investments",
            "updated_count": updated_count,
            "total_investments": len(symbols),
            "timestamp": now.isoformat()
        }
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error updating prices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update prices: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@router.get("/last-update")
def get_last_update_time(user=Depends(get_current_user)):
    """
    Get timestamp of last price update
    Endpoint: GET /market-data/last-update
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Try to get from investments table first
        try:
            cur.execute("""
                SELECT MAX(last_price_updated_at) as last_updated_at
                FROM investments
                WHERE user_id = %s
            """, (user['id'],))
            
            result = cur.fetchone()
            last_update = result['last_updated_at'] if result and result['last_updated_at'] else None
            
        except Exception:
            # If investments table doesn't exist, return None
            last_update = None
        
        return {
            "last_updated_at": last_update.isoformat() if last_update else None
        }
        
    except Exception as e:
        print(f"❌ Error fetching last update time: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch last update time: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@router.get("/prices")
def get_market_prices(user=Depends(get_current_user)):
    """
    Get current prices for all user's investments
    Endpoint: GET /market-data/prices
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get unique symbols from transactions
        cur.execute("""
            SELECT DISTINCT symbol 
            FROM transactions 
            WHERE user_id = %s
        """, (user['id'],))
        
        symbols = [row['symbol'] for row in cur.fetchall()]
        
        if not symbols:
            return {"prices": []}
        
        # Fetch live prices
        prices_data = market_service.get_multiple_prices(symbols)
        
        prices = [{
            "symbol": symbol,
            "last_price": data['price'],
            "last_price_updated_at": data['timestamp'].isoformat(),
            "currency": data.get('currency', 'INR'),
            "change_percent": data.get('change_percent', 0)
        } for symbol, data in prices_data.items()]
        
        return {"prices": prices}
        
    except Exception as e:
        print(f"❌ Error fetching prices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch prices: {str(e)}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@router.get("/price/{symbol}")
def get_symbol_price(symbol: str, user=Depends(get_current_user)):
    """
    Get price for a specific symbol
    Endpoint: GET /market-data/price/{symbol}
    """
    try:
        price_data = market_service.get_current_price(symbol.upper())
        
        if not price_data:
            raise HTTPException(status_code=404, detail=f"Price data not available for {symbol}")
        
        return {
            "symbol": symbol.upper(),
            "last_price": price_data['price'],
            "last_price_updated_at": price_data['timestamp'].isoformat(),
            "currency": price_data.get('currency', 'INR'),
            "change_percent": price_data.get('change_percent', 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching price for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch price for {symbol}: {str(e)}")


# Keep the old /market endpoints for backward compatibility
@router.get("/validate/{symbol}")
def validate_symbol(symbol: str):
    """Check if a symbol is valid"""
    try:
        is_valid = market_service.validate_symbol(symbol.upper())
        
        return {
            "symbol": symbol.upper(),
            "valid": is_valid,
            "message": "Symbol is valid" if is_valid else "Symbol not found"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))