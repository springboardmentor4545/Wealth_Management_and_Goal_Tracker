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
    Returns a dictionary of {symbol: (price, timestamp)}
    """
    results = {}
    if not symbols:
        return results
        
    try:
        # yfinance download is faster for many symbols
        data = yf.download(symbols, period="1d", group_by='ticker', threads=True, progress=False)
        timestamp = datetime.utcnow()
        
        for symbol in symbols:
            try:
                if len(symbols) == 1:
                    price = float(data['Close'].iloc[-1])
                else:
                    price = float(data[symbol]['Close'].iloc[-1])
                
                if price is not None and not math.isnan(price):
                    results[symbol] = (price, timestamp)
            except Exception:
                # Fallback to single fetch if batch fails for a symbol
                p, t = fetch_latest_price(symbol)
                if p:
                    results[symbol] = (p, t)
    except Exception as e:
        logger.error(f"Batch fetch error: {e}")
        # Final fallback
        for symbol in symbols:
            p, t = fetch_latest_price(symbol)
            if p:
                results[symbol] = (p, t)
                
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
