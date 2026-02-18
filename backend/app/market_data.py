"""
Market Data Service - Unified Yahoo Finance and Alpha Vantage Integration
"""
import yfinance as yf
import asyncio
from decimal import Decimal
from typing import Optional, Tuple, Dict, List
from concurrent.futures import ThreadPoolExecutor
import logging
import re
import time

from .config import settings
from .alpha_vantage_service import (
    get_alpha_vantage_quote,
    get_alpha_vantage_quotes,
    AlphaVantageService
)

logger = logging.getLogger(__name__)

# Cache for failed symbols to avoid repeated API calls
FAILED_SYMBOLS_CACHE = {}
CACHE_DURATION = 300  # 5 minutes

# Cache for successful price fetches to reduce API calls
PRICE_CACHE = {}
PRICE_CACHE_DURATION = 60  # 1 minute for price cache

# Simple rate limiting for Yahoo Finance
LAST_API_CALL = 0
MIN_API_INTERVAL = 0.1  # 100ms between calls


def is_symbol_recently_failed(symbol: str) -> bool:
    """Check if a symbol has recently failed to avoid repeated calls"""
    current_time = time.time()
    if symbol in FAILED_SYMBOLS_CACHE:
        last_failed_time = FAILED_SYMBOLS_CACHE[symbol]
        if current_time - last_failed_time < CACHE_DURATION:
            return True
        else:
            # Remove expired entry
            del FAILED_SYMBOLS_CACHE[symbol]
    return False


def mark_symbol_as_failed(symbol: str):
    """Mark a symbol as failed to avoid repeated API calls"""
    FAILED_SYMBOLS_CACHE[symbol] = time.time()
    logger.info(f"Marked {symbol} as failed, will skip for {CACHE_DURATION} seconds")


def is_price_cached(symbol: str) -> Tuple[bool, Optional[Tuple[Decimal, Decimal]]]:
    """Check if price is cached and still valid"""
    current_time = time.time()
    if symbol in PRICE_CACHE:
        cache_entry = PRICE_CACHE[symbol]
        if current_time - cache_entry['timestamp'] < PRICE_CACHE_DURATION:
            logger.debug(f"Using cached price for {symbol}")
            return True, (cache_entry['price'], cache_entry['change'])
        else:
            # Remove expired entry
            del PRICE_CACHE[symbol]
    return False, None


def cache_price(symbol: str, price: Decimal, change: Decimal):
    """Cache a successful price fetch"""
    PRICE_CACHE[symbol] = {
        'price': price,
        'change': change,
        'timestamp': time.time()
    }


def enforce_rate_limit():
    """Simple rate limiting for Yahoo Finance"""
    global LAST_API_CALL
    current_time = time.time()
    time_since_last = current_time - LAST_API_CALL
    
    if time_since_last < MIN_API_INTERVAL:
        sleep_time = MIN_API_INTERVAL - time_since_last
        logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
        time.sleep(sleep_time)
    
    LAST_API_CALL = time.time()


def normalize_symbol(symbol: str) -> str:
    """
    Normalize a symbol for Yahoo Finance API.
    Converts common asset names to proper ticker symbols.
    
    Args:
        symbol: Asset name or symbol
    
    Returns:
        str: Normalized symbol for Yahoo Finance
    """
    if not symbol:
        return symbol
    
    # Remove any leading/trailing whitespace and convert to uppercase
    symbol = symbol.strip().upper()
    
    # Remove any $ prefix if present
    if symbol.startswith('$'):
        symbol = symbol[1:]
    
    # Common Indian stock symbol mappings
    indian_symbols = {
        "TCS": "TCS.NS",
        "WIPRO": "WIPRO.NS",
        "INFOSYS": "INFY.NS",
        "RELIANCE": "RELIANCE.NS",
        "HDFC BANK": "HDFCBANK.NS",
        "HDFCBANK": "HDFCBANK.NS",
        "ICICI BANK": "ICICIBANK.NS",
        "ICICIBANK": "ICICIBANK.NS",
        "SBI": "SBIN.NS",
        "STATE BANK OF INDIA": "SBIN.NS",
        "LARSEN & TOUBRO": "LT.NS",
        "L&T": "LT.NS",
        "ITC": "ITC.NS",
        "BAJAJ AUTO": "BAJAJAU.NS",
        "MARUTI": "MARUTI.NS",
        "MARUTI SUZUKI": "MARUTI.NS",
    }
    
    # Check if it's a known Indian stock
    if symbol in indian_symbols:
        return indian_symbols[symbol]
    
    # If it already has .NS suffix, return as is
    if symbol.endswith('.NS') or symbol.endswith('.BO'):
        return symbol
    
    # If it looks like an Indian stock (all caps, no dots), add .NS suffix
    if re.match(r'^[A-Z]+$', symbol) and len(symbol) <= 10:
        return f"{symbol}.NS"
    
    # Otherwise return as is (for US stocks, ETFs, etc.)
    return symbol


# Mock price data for testing when needed
MOCK_PRICES = {
    # Major Indian Stocks
    "TCS.NS": {"price": 3850.25, "change": 45.75},
    "WIPRO.NS": {"price": 445.60, "change": -12.40},
    "RELIANCE.NS": {"price": 2845.30, "change": 23.80},
    "INFY.NS": {"price": 1725.45, "change": 15.25},
    "HDFCBANK.NS": {"price": 1654.20, "change": -8.50},
    "ICICIBANK.NS": {"price": 1245.80, "change": 22.35},
    "SBIN.NS": {"price": 825.40, "change": 12.15},
    "ITC.NS": {"price": 456.75, "change": 5.25},
    "LT.NS": {"price": 3625.90, "change": -15.30},
    "MARUTI.NS": {"price": 11245.80, "change": 125.30},
    "BAJAJAU.NS": {"price": 7832.45, "change": -42.15},
    
    # US stocks
    "AAPL": {"price": 227.50, "change": 3.25},
    "GOOGL": {"price": 2825.40, "change": -12.60},
    "MSFT": {"price": 431.20, "change": 5.80},
    "TSLA": {"price": 695.30, "change": -8.45},
    "AMZN": {"price": 3456.80, "change": 15.40},
    "NVDA": {"price": 875.40, "change": 22.60},
}


def get_mock_price(symbol: str) -> Tuple[Optional[Decimal], Optional[Decimal]]:
    """Get mock price data for testing"""
    if symbol in MOCK_PRICES:
        data = MOCK_PRICES[symbol]
        logger.info(f"Using mock price for {symbol}: {data['price']} (change: {data['change']})")
        return Decimal(str(data['price'])), Decimal(str(data['change']))
    return None, None


def get_current_price(symbol: str, retry_count: int = 2) -> Tuple[Optional[Decimal], Optional[Decimal]]:
    """
    Fetch current price for a stock using Yahoo Finance.
    Falls back to mock data if Yahoo Finance is unavailable.
    
    Args:
        symbol: Stock symbol (e.g., 'RELIANCE.NS', 'TCS.NS', 'AAPL')
        retry_count: Number of retries for failed requests
    
    Returns:
        Tuple[Decimal, Decimal]: (current_price, day_change) or (None, None) if fetch fails
    """
    try:
        if not symbol or not isinstance(symbol, str):
            logger.warning(f"Invalid symbol: {symbol}")
            return None, None
        
        # Normalize the symbol
        normalized_symbol = normalize_symbol(symbol)
        
        # Check cache first
        is_cached, cached_result = is_price_cached(normalized_symbol)
        if is_cached:
            return cached_result
        
        # Check if symbol recently failed
        if is_symbol_recently_failed(normalized_symbol):
            logger.info(f"Skipping {normalized_symbol} - recently failed, using mock data")
            return get_mock_price(normalized_symbol)
        
        logger.info(f"Fetching live price for: {symbol} -> {normalized_symbol}")
        
        # Try Yahoo Finance with retry logic
        for attempt in range(retry_count + 1):
            try:
                # Enforce rate limiting
                enforce_rate_limit()
                
                # Create ticker object
                ticker = yf.Ticker(normalized_symbol)
                
                # Try to get price data
                result = _fetch_yahoo_price(ticker, normalized_symbol)
                if result:
                    price, change = result
                    # Cache successful result
                    cache_price(normalized_symbol, price, change)
                    logger.info(f"Yahoo Finance: {normalized_symbol} = ${price} (${change})")
                    return price, change
                    
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed for {normalized_symbol}: {str(e)}")
                if attempt < retry_count:
                    time.sleep(1.0 * (attempt + 1))  # Progressive backoff
                    continue
                else:
                    break
        
        # If Yahoo Finance failed, try mock data
        logger.warning(f"Yahoo Finance failed for {normalized_symbol}, trying mock data")
        mark_symbol_as_failed(normalized_symbol)
        
        mock_price, mock_change = get_mock_price(normalized_symbol)
        if mock_price is not None:
            return mock_price, mock_change
        
        logger.warning(f"No data available for symbol: {normalized_symbol}")
        return None, None
        
    except Exception as e:
        logger.error(f"Failed to fetch price for {symbol}: {str(e)}")
        return None, None


def _fetch_yahoo_price(ticker, symbol: str) -> Optional[Tuple[Decimal, Decimal]]:
    """Fetch price data from Yahoo Finance with multiple fallback strategies"""
    # Strategy 1: Try different historical periods
    periods = ['1d', '5d']
    
    for period in periods:
        try:
            logger.debug(f"Trying period {period} for {symbol}")
            data = ticker.history(period=period, timeout=settings.YAHOO_FINANCE_TIMEOUT)
            
            if not data.empty and len(data) > 0:
                close_prices = data['Close'].dropna()
                if len(close_prices) > 0:
                    current_price = close_prices.iloc[-1]
                    
                    # Calculate day change
                    day_change = Decimal('0')
                    if len(close_prices) >= 2:
                        prev_price = close_prices.iloc[-2]
                        day_change = current_price - prev_price
                    
                    if current_price > 0:
                        return Decimal(str(round(current_price, 2))), Decimal(str(round(day_change, 2)))
                        
        except Exception as e:
            logger.debug(f"Period {period} failed for {symbol}: {str(e)}")
            continue
    
    # Strategy 2: Try ticker info
    try:
        logger.debug(f"Trying ticker.info for {symbol}")
        info = ticker.info
        if info and 'regularMarketPrice' in info:
            price = info['regularMarketPrice']
            prev_close = info.get('previousClose', price)
            change = price - prev_close if prev_close else 0
            
            if price and price > 0:
                return Decimal(str(round(price, 2))), Decimal(str(round(change, 2)))
                
    except Exception as e:
        logger.debug(f"ticker.info failed for {symbol}: {str(e)}")
    
    return None


def get_multiple_prices(symbols: List[str]) -> Dict[str, Tuple[Optional[Decimal], Optional[Decimal]]]:
    """
    Fetch prices for multiple symbols efficiently using threading.
    
    Args:
        symbols: List of stock symbols to fetch
        
    Returns:
        Dict mapping symbol to (price, change) tuple
    """
    if not symbols:
        return {}
    
    logger.info(f"Fetching prices for {len(symbols)} symbols: {symbols}")
    
    # Use ThreadPoolExecutor for concurrent fetching
    with ThreadPoolExecutor(max_workers=min(len(symbols), 5)) as executor:
        future_to_symbol = {
            executor.submit(get_current_price, symbol): symbol 
            for symbol in symbols
        }
        
        results = {}
        for future in future_to_symbol:
            symbol = future_to_symbol[future]
            try:
                price, change = future.result(timeout=30)
                results[symbol] = (price, change)
                logger.debug(f"Fetched {symbol}: {price} (change: {change})")
            except Exception as e:
                logger.error(f"Failed to fetch {symbol}: {str(e)}")
                results[symbol] = (None, None)
    
    success_count = len([r for r in results.values() if r[0] is not None])
    logger.info(f"Successfully fetched {success_count} out of {len(symbols)} prices")
    return results


def clear_price_cache():
    """Clear the price cache - useful for testing or manual refresh"""
    global PRICE_CACHE
    PRICE_CACHE.clear()
    logger.info("Price cache cleared")


def get_cache_stats() -> Dict[str, int]:
    """Get statistics about cache usage"""
    current_time = time.time()
    
    # Count valid cached prices
    valid_price_cache = sum(
        1 for entry in PRICE_CACHE.values()
        if current_time - entry['timestamp'] < PRICE_CACHE_DURATION
    )
    
    # Count failed symbols that are still being avoided
    valid_failed_cache = sum(
        1 for timestamp in FAILED_SYMBOLS_CACHE.values()
        if current_time - timestamp < CACHE_DURATION
    )
    
    return {
        "cached_prices": valid_price_cache,
        "failed_symbols": valid_failed_cache,
        "total_price_cache_entries": len(PRICE_CACHE),
        "total_failed_cache_entries": len(FAILED_SYMBOLS_CACHE)
    }


def validate_symbol(symbol: str) -> bool:
    """
    Validate if a symbol is tradeable on Yahoo Finance.
    
    Args:
        symbol: Stock symbol to validate
    
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        price, _ = get_current_price(symbol)
        return price is not None
    except Exception as e:
        logger.error(f"Symbol validation failed for {symbol}: {str(e)}")
        return False


# Common Indian Stock Symbols (Reference)
COMMON_SYMBOLS = {
    "Reliance Industries": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "Infosys": "INFY.NS",
    "Wipro": "WIPRO.NS",
    "HDFC Bank": "HDFCBANK.NS",
    "ICICI Bank": "ICICIBANK.NS",
    "State Bank of India": "SBIN.NS",
    "Larsen & Toubro": "LT.NS",
    "ITC": "ITC.NS",
    "Bajaj Auto": "BAJAJAU.NS",
    "Maruti Suzuki": "MARUTI.NS"
}

# ===== ALPHA VANTAGE INTEGRATION =====

async def get_alpha_vantage_stock_data(symbol: str) -> Optional[Dict]:
    """
    Get comprehensive stock data from Alpha Vantage
    
    Args:
        symbol: Stock symbol (e.g., 'AAPL', 'GOOGL')
        
    Returns:
        Dict with stock quote and company info or None if failed
    """
    try:
        logger.info(f"Fetching Alpha Vantage data for {symbol}")
        
        async with AlphaVantageService() as av:
            # Get both quote and company overview
            quote_task = av.get_stock_quote(symbol)
            overview_task = av.get_company_overview(symbol)
            
            quote_data, overview_data = await asyncio.gather(
                quote_task, overview_task, return_exceptions=True
            )
            
            # Handle exceptions
            if isinstance(quote_data, Exception):
                logger.error(f"Quote fetch failed for {symbol}: {quote_data}")
                quote_data = None
                
            if isinstance(overview_data, Exception):
                logger.warning(f"Overview fetch failed for {symbol}: {overview_data}")
                overview_data = None
            
            # Combine data
            combined_data = {}
            if quote_data:
                combined_data.update(quote_data)
            if overview_data:
                combined_data.update(overview_data)
                
            return combined_data if combined_data else None
            
    except Exception as e:
        logger.error(f"Error fetching Alpha Vantage data for {symbol}: {str(e)}")
        return None

def get_unified_stock_data(symbol: str, preferred_source: str = 'alpha_vantage') -> Tuple[Optional[Decimal], Optional[Decimal], Optional[Dict]]:
    """
    Get stock data using preferred source with fallback
    
    Args:
        symbol: Stock symbol
        preferred_source: 'alpha_vantage' or 'yahoo'
        
    Returns:
        Tuple of (price, change, additional_data)
    """
    try:
        if preferred_source == 'alpha_vantage' and settings.USE_ALPHA_VANTAGE:
            # Try Alpha Vantage first
            logger.info(f"Trying Alpha Vantage for {symbol}")
            try:
                # Run async function in sync context
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    av_data = loop.run_until_complete(get_alpha_vantage_stock_data(symbol))
                    if av_data and av_data.get('price'):
                        price = av_data.get('price')
                        change = av_data.get('change') or Decimal('0')
                        logger.info(f"Alpha Vantage success for {symbol}: ${price}")
                        return price, change, av_data
                finally:
                    loop.close()
            except Exception as e:
                logger.warning(f"Alpha Vantage failed for {symbol}, trying Yahoo Finance: {str(e)}")
        
        # Fallback to Yahoo Finance
        logger.info(f"Using Yahoo Finance for {symbol}")
        price, change = get_current_price(symbol)
        if price:
            return price, change, {'source': 'yahoo_finance', 'symbol': symbol}
        
        # If both fail, return None
        logger.warning(f"Both data sources failed for {symbol}")
        return None, None, None
        
    except Exception as e:
        logger.error(f"Error in unified stock data fetch for {symbol}: {str(e)}")
        return None, None, None

async def get_multiple_alpha_vantage_data(symbols: List[str]) -> Dict[str, Optional[Dict]]:
    """
    Get Alpha Vantage data for multiple symbols efficiently
    
    Args:
        symbols: List of stock symbols
        
    Returns:
        Dict mapping symbol to stock data
    """
    if not symbols:
        return {}
    
    try:
        logger.info(f"Fetching Alpha Vantage data for {len(symbols)} symbols")
        
        async with AlphaVantageService() as av:
            results = await av.get_multiple_quotes(symbols)
            
            # Add company overview for successful quotes
            for symbol, quote_data in results.items():
                if quote_data:
                    try:
                        overview_data = await av.get_company_overview(symbol)
                        if overview_data:
                            quote_data.update(overview_data)
                    except Exception as e:
                        logger.warning(f"Failed to get overview for {symbol}: {str(e)}")
            
            return results
            
    except Exception as e:
        logger.error(f"Error fetching multiple Alpha Vantage data: {str(e)}")
        return {symbol: None for symbol in symbols}

def get_enhanced_portfolio_data(symbols: List[str]) -> Dict[str, Dict]:
    """
    Get enhanced portfolio data using Alpha Vantage + Yahoo Finance
    
    Args:
        symbols: List of stock symbols
        
    Returns:
        Dict mapping symbol to comprehensive stock data
    """
    if not symbols:
        return {}
    
    try:
        logger.info(f"Getting enhanced data for portfolio symbols: {symbols}")
        
        # Try Alpha Vantage first if enabled
        if settings.USE_ALPHA_VANTAGE:
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    av_results = loop.run_until_complete(get_multiple_alpha_vantage_data(symbols))
                    
                    # Process results and add Yahoo Finance fallback
                    enhanced_data = {}
                    for symbol in symbols:
                        av_data = av_results.get(symbol)
                        
                        if av_data and av_data.get('price'):
                            # Alpha Vantage success
                            enhanced_data[symbol] = {
                                'price': av_data.get('price'),
                                'change': av_data.get('change', Decimal('0')),
                                'change_percent': av_data.get('change_percent', '0'),
                                'volume': av_data.get('volume'),
                                'market_cap': av_data.get('market_cap'),
                                'pe_ratio': av_data.get('pe_ratio'),
                                'company_name': av_data.get('name'),
                                'sector': av_data.get('sector'),
                                'industry': av_data.get('industry'),
                                'source': 'alpha_vantage',
                                'last_updated': av_data.get('last_updated'),
                                'raw_data': av_data
                            }
                        else:
                            # Fallback to Yahoo Finance
                            logger.info(f"Alpha Vantage failed for {symbol}, using Yahoo Finance fallback")
                            price, change = get_current_price(symbol)
                            if price:
                                enhanced_data[symbol] = {
                                    'price': price,
                                    'change': change or Decimal('0'),
                                    'change_percent': '0',
                                    'volume': None,
                                    'market_cap': None,
                                    'pe_ratio': None,
                                    'company_name': symbol,
                                    'sector': None,
                                    'industry': None,
                                    'source': 'yahoo_finance',
                                    'last_updated': time.time(),
                                    'raw_data': None
                                }
                            else:
                                enhanced_data[symbol] = None
                    
                    return enhanced_data
                    
                finally:
                    loop.close()
                    
            except Exception as e:
                logger.error(f"Error with Alpha Vantage batch fetch: {str(e)}")
        
        # Fallback to Yahoo Finance only
        logger.info("Using Yahoo Finance for all symbols")
        yahoo_results = get_multiple_prices(symbols)
        
        enhanced_data = {}
        for symbol, (price, change) in yahoo_results.items():
            if price:
                enhanced_data[symbol] = {
                    'price': price,
                    'change': change or Decimal('0'),
                    'change_percent': '0',
                    'volume': None,
                    'market_cap': None,
                    'pe_ratio': None,
                    'company_name': symbol,
                    'sector': None,
                    'industry': None,
                    'source': 'yahoo_finance',
                    'last_updated': time.time(),
                    'raw_data': None
                }
            else:
                enhanced_data[symbol] = None
        
        return enhanced_data
        
    except Exception as e:
        logger.error(f"Error in enhanced portfolio data fetch: {str(e)}")
        return {symbol: None for symbol in symbols}