import yfinance as yf
from datetime import datetime
from typing import Dict, Optional
# powerful "unofficial" API wrapper hai jiske liye kisi API Key ki zaroorat nahi hoti
def fetch_current_price(symbol: str) -> Optional[float]:
    """
    Fetch the latest price for a given symbol using yfinance.
    Handles basic error catching.
    """
    try:
        ticker = yf.Ticker(symbol)
        # fast_info is often better for just the current price
        # but history(period="1d") is more reliable for real-time-ish price
        data = ticker.history(period="1d")
        if not data.empty:
            # Get the last close price
            return float(data['Close'].iloc[-1])
        return None
    except Exception as e:
        print(f"Error fetching price for {symbol}: {e}")
        return None

def update_investment_prices(db_session, user_id: Optional[int] = None):
    """
    Update last_price and current_value for investments.
    If user_id is provided, only updates for that user.
    """
    from .models import Investment
    
    query = db_session.query(Investment)
    if user_id:
        query = query.filter(Investment.user_id == user_id)
    
    investments = query.all()
    
    # Simple cache to avoid redundant API calls for the same symbol
    price_cache: Dict[str, float] = {}
    
    for inv in investments:
        symbol = inv.symbol.upper()
        
        if symbol not in price_cache:
            price = fetch_current_price(symbol)
            if price is not None:
                price_cache[symbol] = price
        
        if symbol in price_cache:
            inv.last_price = price_cache[symbol]
            inv.last_price_updated_at = datetime.now()
            inv.current_value = inv.quantity * inv.last_price
    
    db_session.commit()
