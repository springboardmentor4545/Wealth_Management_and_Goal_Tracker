import yfinance as yf
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import time

class MarketDataService:
    """Service to fetch market data from Yahoo Finance"""
    
    # Rate limiting
    RATE_LIMIT_DELAY = 0.5  # 500ms between requests
    CACHE_DURATION = timedelta(minutes=15)  # Cache for 15 minutes
    
    def __init__(self):
        self.cache = {}
        self.last_request_time = {}
    
    def _apply_rate_limit(self, symbol: str):
        """Apply rate limiting to avoid hitting API limits"""
        current_time = time.time()
        if symbol in self.last_request_time:
            time_since_last = current_time - self.last_request_time[symbol]
            if time_since_last < self.RATE_LIMIT_DELAY:
                time.sleep(self.RATE_LIMIT_DELAY - time_since_last)
        
        self.last_request_time[symbol] = time.time()
    
    def _is_cache_valid(self, symbol: str) -> bool:
        """Check if cached data is still valid"""
        if symbol not in self.cache:
            return False
        
        cached_time = self.cache[symbol]['timestamp']
        return datetime.now() - cached_time < self.CACHE_DURATION
    
    def get_current_price(self, symbol: str) -> Optional[Dict]:
        """
        Fetch current price for a symbol from Yahoo Finance
        
        Returns:
            {
                'symbol': str,
                'price': float,
                'timestamp': datetime,
                'currency': str,
                'change_percent': float
            }
        """
        try:
            # Check cache first
            if self._is_cache_valid(symbol):
                print(f"✅ Using cached price for {symbol}")
                return self.cache[symbol]['data']
            
            # Apply rate limiting
            self._apply_rate_limit(symbol)
            
            # Fetch from Yahoo Finance
            print(f"🔄 Fetching live price for {symbol}")
            ticker = yf.Ticker(symbol)
            
            # Get current data
            info = ticker.info
            
            # Try to get current price from different sources
            current_price = (
                info.get('currentPrice') or 
                info.get('regularMarketPrice') or 
                info.get('previousClose')
            )
            
            if not current_price:
                print(f"❌ No price data available for {symbol}")
                return None
            
            # Calculate change percentage
            previous_close = info.get('previousClose', current_price)
            change_percent = ((current_price - previous_close) / previous_close * 100) if previous_close else 0
            
            result = {
                'symbol': symbol,
                'price': float(current_price),
                'timestamp': datetime.now(),
                'currency': info.get('currency', 'INR'),
                'change_percent': round(change_percent, 2),
                'market_state': info.get('marketState', 'REGULAR')
            }
            
            # Cache the result
            self.cache[symbol] = {
                'data': result,
                'timestamp': datetime.now()
            }
            
            print(f"✅ Fetched {symbol}: ₹{current_price:.2f} ({change_percent:+.2f}%)")
            return result
            
        except Exception as e:
            print(f"❌ Error fetching price for {symbol}: {str(e)}")
            return None
    
    def get_multiple_prices(self, symbols: List[str]) -> Dict[str, Dict]:
        """
        Fetch prices for multiple symbols
        
        Returns:
            {
                'SYMBOL1': {'price': 100, 'timestamp': ...},
                'SYMBOL2': {'price': 200, 'timestamp': ...},
                ...
            }
        """
        results = {}
        
        for symbol in symbols:
            price_data = self.get_current_price(symbol)
            if price_data:
                results[symbol] = price_data
            else:
                print(f"⚠️ Skipping {symbol} - no data available")
        
        return results
    
    def validate_symbol(self, symbol: str) -> bool:
        """Check if a symbol exists on Yahoo Finance"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # Check if we got valid data
            return 'currentPrice' in info or 'regularMarketPrice' in info
        except:
            return False


# Singleton instance
market_service = MarketDataService()


# Helper function to update investments with latest prices
def update_investment_prices(conn, user_id: Optional[int] = None):
    """
    Update investment prices and current values
    
    Args:
        conn: Database connection
        user_id: Optional user ID to update specific user's investments
    """
    cur = conn.cursor()
    
    try:
        # Get all unique symbols (optionally for specific user)
        if user_id:
            cur.execute("""
                SELECT DISTINCT symbol 
                FROM investments 
                WHERE user_id = %s AND units > 0
            """, (user_id,))
        else:
            cur.execute("""
                SELECT DISTINCT symbol 
                FROM investments 
                WHERE units > 0
            """)
        
        symbols = [row['symbol'] for row in cur.fetchall()]
        
        if not symbols:
            print("ℹ️ No symbols to update")
            return
        
        print(f"📊 Updating prices for {len(symbols)} symbols...")
        
        # Fetch all prices
        prices = market_service.get_multiple_prices(symbols)
        
        # Update each investment
        updated_count = 0
        for symbol, price_data in prices.items():
            cur.execute("""
                UPDATE investments
                SET 
                    last_price = %s,
                    current_value = units * %s,
                    last_price_updated_at = %s
                WHERE symbol = %s AND units > 0
            """, (
                price_data['price'],
                price_data['price'],
                price_data['timestamp'],
                symbol
            ))
            updated_count += cur.rowcount
        
        conn.commit()
        print(f"✅ Updated {updated_count} investment records")
        
        return {
            'symbols_fetched': len(prices),
            'records_updated': updated_count,
            'timestamp': datetime.now()
        }
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error updating prices: {str(e)}")
        raise
    finally:
        cur.close()