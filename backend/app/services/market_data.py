import yfinance as yf
from datetime import datetime
import logging
import math
import requests

logger = logging.getLogger(__name__)

def fetch_latest_price(symbol: str):
    """
    Fetch the latest price for a given symbol using yfinance.
    Returns (price, timestamp) or (None, None) if failed.
    """
    try:
        ticker = yf.Ticker(symbol)
        price = float(ticker.fast_info['lastPrice'])
        if price is None or math.isnan(price) or price <= 0:
            # Fallback to history for some symbols if fast_info fails
            hist = ticker.history(period="1d")
            if not hist.empty:
                price = float(hist['Close'].iloc[-1])
                if math.isnan(price):
                    return None, None
            else:
                return None, None
        
        return price, datetime.utcnow()
    except Exception as e:
        logger.error(f"Error fetching price for {symbol}: {e}")
        return None, None

def fetch_prices_batch(symbols: list):
    """
    Fetch prices for multiple symbols.
    Returns a dictionary of {symbol: (price, timestamp, daily_change_pct)}
    """
    results = {}
    if not symbols:
        return results
        
    try:
        # Fetch 2 days of history to calculate daily change
        data = yf.download(symbols, period="2d", group_by='ticker', threads=True, progress=False)
        timestamp = datetime.utcnow()
        
        for symbol in symbols:
            try:
                if len(symbols) == 1:
                    df = data
                else:
                    df = data[symbol]
                
                if not df.empty and len(df) >= 1:
                    last_price = float(df['Close'].iloc[-1])
                    daily_change = 0.0
                    
                    if len(df) >= 2:
                        prev_close = float(df['Close'].iloc[-2])
                        if prev_close > 0:
                            daily_change = ((last_price - prev_close) / prev_close) * 100
                    
                    if not math.isnan(last_price):
                        results[symbol] = (last_price, timestamp, daily_change)
            except Exception as e:
                logger.error(f"Error processing {symbol} in batch: {e}")
                # Fallback to single fetch
                p, t = fetch_latest_price(symbol)
                if p:
                    # Single fetch doesn't easily give daily change without another call, 
                    # but we'll stick to 0 for now as fallback
                    results[symbol] = (p, t, 0.0)
    except Exception as e:
        logger.error(f"Batch fetch error: {e}")
        # Final fallback
        for symbol in symbols:
            p, t = fetch_latest_price(symbol)
            if p:
                results[symbol] = (p, t, 0.0)
                
    return results

def search_symbols(query: str):
    """
    Search for symbols on Yahoo Finance.
    Returns a list of quotes.
    """
    if not query:
        return []
    
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # Extract relevant fields
        results = []
        for quote in data.get('quotes', []):
            results.append({
                'symbol': quote.get('symbol'),
                'name': quote.get('shortname') or quote.get('longname'),
                'type': quote.get('quoteType'),
                'exchange': quote.get('exchange')
            })
        return results
    except Exception as e:
        logger.error(f"Search error for {query}: {e}")
        return []
def update_all_investment_prices_logic(db_session_factory, InvestmentModel):
    """
    Synchronous logic to update market prices for all unique symbols in the database.
    This replaces the background task logic.
    """
    db = db_session_factory()
    try:
        # 1. Get all unique symbols
        investments = db.query(InvestmentModel).all()
        symbols = list(set([inv.symbol for inv in investments if inv.symbol]))
        
        if not symbols:
            logger.info("No symbols to update.")
            return "No symbols found"

        # 2. Fetch prices in batches
        logger.info(f"Fetching prices for {len(symbols)} symbols...")
        price_data = fetch_prices_batch(symbols)
        
        # 3. Update the database
        updates_count = 0
        for inv in investments:
            if inv.symbol in price_data:
                price, timestamp, change = price_data[inv.symbol]
                if price is not None:
                    inv.last_price = price
                    inv.last_price_at = timestamp
                    inv.current_value = float(inv.units) * price
                    inv.daily_change = change
                    updates_count += 1
        
        db.commit()
        logger.info(f"Updated {updates_count} investments.")
        return f"Successfully updated {updates_count} investments"
        
    except Exception as e:
        logger.error(f"Error in price update: {e}")
        db.rollback()
        return f"Error: {str(e)}"
    finally:
        db.close()
