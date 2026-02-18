"""
Alpha Vantage Market Data Service
Provides real-time and historical stock data using Alpha Vantage API
"""

import asyncio
import aiohttp
import logging
from decimal import Decimal
from typing import Optional, Tuple, Dict, List
import time
from datetime import datetime, timedelta

from .config import settings

logger = logging.getLogger(__name__)

# Cache for Alpha Vantage data
AV_PRICE_CACHE = {}
AV_CACHE_DURATION = 300  # 5 minutes cache for Alpha Vantage
AV_FAILED_SYMBOLS = {}
AV_FAILURE_CACHE_DURATION = 900  # 15 minutes for failed symbols

class AlphaVantageService:
    """Service for interacting with Alpha Vantage API"""
    
    def __init__(self):
        self.api_key = settings.ALPHA_VANTAGE_API_KEY
        self.base_url = settings.ALPHA_VANTAGE_BASE_URL
        self.timeout = settings.ALPHA_VANTAGE_TIMEOUT
        self.session = None
        self.rate_limit_delay = 12  # Alpha Vantage allows 5 requests per minute for free tier
        self.last_request_time = 0
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout))
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _rate_limit(self):
        """Implement rate limiting for Alpha Vantage API"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last
            logger.info(f"Rate limiting: waiting {sleep_time:.1f}s before next Alpha Vantage request")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _is_symbol_cached(self, symbol: str) -> Tuple[bool, Optional[Dict]]:
        """Check if symbol data is cached and valid"""
        current_time = time.time()
        cache_key = f"av_{symbol}"
        
        if cache_key in AV_PRICE_CACHE:
            cache_entry = AV_PRICE_CACHE[cache_key]
            if current_time - cache_entry['timestamp'] < AV_CACHE_DURATION:
                logger.debug(f"Using cached Alpha Vantage data for {symbol}")
                return True, cache_entry['data']
            else:
                # Remove expired entry
                del AV_PRICE_CACHE[cache_key]
        
        return False, None
    
    def _cache_symbol_data(self, symbol: str, data: Dict):
        """Cache symbol data"""
        cache_key = f"av_{symbol}"
        AV_PRICE_CACHE[cache_key] = {
            'data': data,
            'timestamp': time.time()
        }
        logger.debug(f"Cached Alpha Vantage data for {symbol}")
    
    def _is_symbol_failed(self, symbol: str) -> bool:
        """Check if symbol recently failed"""
        current_time = time.time()
        if symbol in AV_FAILED_SYMBOLS:
            if current_time - AV_FAILED_SYMBOLS[symbol] < AV_FAILURE_CACHE_DURATION:
                return True
            else:
                del AV_FAILED_SYMBOLS[symbol]
        return False
    
    def _mark_symbol_failed(self, symbol: str):
        """Mark symbol as failed"""
        AV_FAILED_SYMBOLS[symbol] = time.time()
        logger.warning(f"Marked {symbol} as failed for {AV_FAILURE_CACHE_DURATION}s")
    
    async def get_stock_quote(self, symbol: str) -> Optional[Dict]:
        """
        Get real-time stock quote from Alpha Vantage
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL', 'GOOGL')
            
        Returns:
            Dict with stock data or None if failed
        """
        try:
            # Normalize symbol
            symbol = symbol.upper().strip()
            
            # Check cache first
            is_cached, cached_data = self._is_symbol_cached(symbol)
            if is_cached:
                return cached_data
            
            # Check if recently failed
            if self._is_symbol_failed(symbol):
                logger.info(f"Skipping {symbol} - recently failed")
                return None
            
            # Rate limiting
            self._rate_limit()
            
            # Prepare API request
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol,
                'apikey': self.api_key
            }
            
            logger.info(f"Fetching Alpha Vantage quote for {symbol}")
            
            if not self.session:
                self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout))
            
            async with self.session.get(self.base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"Alpha Vantage API error for {symbol}: HTTP {response.status}")
                    self._mark_symbol_failed(symbol)
                    return None
                
                data = await response.json()
                
                # Check for API errors
                if 'Error Message' in data:
                    logger.error(f"Alpha Vantage error for {symbol}: {data['Error Message']}")
                    self._mark_symbol_failed(symbol)
                    return None
                
                if 'Note' in data:
                    logger.warning(f"Alpha Vantage rate limit hit for {symbol}: {data['Note']}")
                    self._mark_symbol_failed(symbol)
                    return None
                
                # Extract quote data
                global_quote = data.get('Global Quote', {})
                if not global_quote:
                    logger.warning(f"No quote data found for {symbol}")
                    self._mark_symbol_failed(symbol)
                    return None
                
                # Parse the response
                quote_data = {
                    'symbol': global_quote.get('01. symbol', symbol),
                    'open': self._safe_decimal(global_quote.get('02. open')),
                    'high': self._safe_decimal(global_quote.get('03. high')),
                    'low': self._safe_decimal(global_quote.get('04. low')),
                    'price': self._safe_decimal(global_quote.get('05. price')),
                    'volume': self._safe_int(global_quote.get('06. volume')),
                    'latest_trading_day': global_quote.get('07. latest trading day'),
                    'previous_close': self._safe_decimal(global_quote.get('08. previous close')),
                    'change': self._safe_decimal(global_quote.get('09. change')),
                    'change_percent': global_quote.get('10. change percent', '0%').replace('%', ''),
                    'last_updated': datetime.now().isoformat()
                }
                
                # Cache the data
                self._cache_symbol_data(symbol, quote_data)
                
                logger.info(f"Successfully fetched Alpha Vantage data for {symbol}: ${quote_data['price']}")
                return quote_data
                
        except Exception as e:
            logger.error(f"Exception fetching Alpha Vantage data for {symbol}: {str(e)}")
            self._mark_symbol_failed(symbol)
            return None
    
    async def get_multiple_quotes(self, symbols: List[str]) -> Dict[str, Optional[Dict]]:
        """
        Get quotes for multiple symbols
        
        Args:
            symbols: List of stock symbols
            
        Returns:
            Dict mapping symbol to quote data
        """
        if not symbols:
            return {}
        
        logger.info(f"Fetching Alpha Vantage quotes for {len(symbols)} symbols: {symbols}")
        results = {}
        
        # Process symbols sequentially due to rate limiting
        for symbol in symbols:
            try:
                quote_data = await self.get_stock_quote(symbol)
                results[symbol] = quote_data
                logger.debug(f"Alpha Vantage result for {symbol}: {'Success' if quote_data else 'Failed'}")
            except Exception as e:
                logger.error(f"Error fetching {symbol}: {str(e)}")
                results[symbol] = None
        
        success_count = len([r for r in results.values() if r is not None])
        logger.info(f"Alpha Vantage: Successfully fetched {success_count}/{len(symbols)} symbols")
        
        return results
    
    def _safe_decimal(self, value) -> Optional[Decimal]:
        """Safely convert to Decimal"""
        try:
            if value is None or value == '':
                return None
            return Decimal(str(value))
        except (ValueError, TypeError):
            return None
    
    def _safe_int(self, value) -> Optional[int]:
        """Safely convert to int"""
        try:
            if value is None or value == '':
                return None
            return int(float(str(value)))
        except (ValueError, TypeError):
            return None

    async def get_company_overview(self, symbol: str) -> Optional[Dict]:
        """
        Get company overview data from Alpha Vantage
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Dict with company data or None if failed
        """
        try:
            symbol = symbol.upper().strip()
            
            # Check cache
            cache_key = f"av_overview_{symbol}"
            if cache_key in AV_PRICE_CACHE:
                cache_entry = AV_PRICE_CACHE[cache_key]
                # Use longer cache for company overview (1 hour)
                if time.time() - cache_entry['timestamp'] < 3600:
                    return cache_entry['data']
            
            # Rate limiting
            self._rate_limit()
            
            params = {
                'function': 'OVERVIEW',
                'symbol': symbol,
                'apikey': self.api_key
            }
            
            logger.info(f"Fetching Alpha Vantage overview for {symbol}")
            
            if not self.session:
                self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout))
            
            async with self.session.get(self.base_url, params=params) as response:
                if response.status != 200:
                    logger.error(f"Alpha Vantage overview API error for {symbol}: HTTP {response.status}")
                    return None
                
                data = await response.json()
                
                if 'Error Message' in data or not data.get('Symbol'):
                    logger.warning(f"No overview data for {symbol}")
                    return None
                
                overview_data = {
                    'symbol': data.get('Symbol'),
                    'name': data.get('Name'),
                    'description': data.get('Description'),
                    'exchange': data.get('Exchange'),
                    'currency': data.get('Currency'),
                    'country': data.get('Country'),
                    'sector': data.get('Sector'),
                    'industry': data.get('Industry'),
                    'market_cap': self._safe_int(data.get('MarketCapitalization')),
                    'pe_ratio': self._safe_decimal(data.get('PERatio')),
                    'peg_ratio': self._safe_decimal(data.get('PEGRatio')),
                    'book_value': self._safe_decimal(data.get('BookValue')),
                    'div_yield': self._safe_decimal(data.get('DividendYield')),
                    'eps': self._safe_decimal(data.get('EPS')),
                    '52_week_high': self._safe_decimal(data.get('52WeekHigh')),
                    '52_week_low': self._safe_decimal(data.get('52WeekLow')),
                }
                
                # Cache with longer duration
                AV_PRICE_CACHE[cache_key] = {
                    'data': overview_data,
                    'timestamp': time.time()
                }
                
                logger.info(f"Successfully fetched overview for {symbol}: {overview_data['name']}")
                return overview_data
                
        except Exception as e:
            logger.error(f"Exception fetching overview for {symbol}: {str(e)}")
            return None

# Global instance
alpha_vantage_service = AlphaVantageService()

# Helper functions for backward compatibility
async def get_alpha_vantage_quote(symbol: str) -> Optional[Dict]:
    """Get single stock quote using Alpha Vantage"""
    async with AlphaVantageService() as av:
        return await av.get_stock_quote(symbol)

async def get_alpha_vantage_quotes(symbols: List[str]) -> Dict[str, Optional[Dict]]:
    """Get multiple stock quotes using Alpha Vantage"""
    async with AlphaVantageService() as av:
        return await av.get_multiple_quotes(symbols)

def clear_alpha_vantage_cache():
    """Clear Alpha Vantage cache"""
    global AV_PRICE_CACHE, AV_FAILED_SYMBOLS
    AV_PRICE_CACHE.clear()
    AV_FAILED_SYMBOLS.clear()
    logger.info("Alpha Vantage cache cleared")

def get_alpha_vantage_cache_stats() -> Dict[str, int]:
    """Get Alpha Vantage cache statistics"""
    current_time = time.time()
    
    valid_cache = sum(
        1 for entry in AV_PRICE_CACHE.values()
        if current_time - entry['timestamp'] < AV_CACHE_DURATION
    )
    
    valid_failed = sum(
        1 for timestamp in AV_FAILED_SYMBOLS.values()
        if current_time - timestamp < AV_FAILURE_CACHE_DURATION
    )
    
    return {
        "cached_quotes": valid_cache,
        "failed_symbols": valid_failed,
        "total_cache_entries": len(AV_PRICE_CACHE),
        "total_failed_entries": len(AV_FAILED_SYMBOLS)
    }