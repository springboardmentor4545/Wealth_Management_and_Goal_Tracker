#!/usr/bin/env python3
"""
Test script for the simplified Yahoo Finance market data service
"""
import sys
import os
import logging

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Test the market data module
try:
    from app.market_data import get_current_price, normalize_symbol, get_mock_price
    from app.config import settings
    
    # Test symbols
    test_symbols = ["RELIANCE.NS", "TCS.NS", "AAPL", "MSFT", "GOOGL"]
    
    print("Testing simplified Yahoo Finance market data service...")
    print(f"Yahoo Finance timeout setting: {settings.YAHOO_FINANCE_TIMEOUT}s")
    print("-" * 60)
    
    for symbol in test_symbols:
        print(f"\nTesting symbol: {symbol}")
        
        # Test symbol normalization
        normalized = normalize_symbol(symbol)
        print(f"  Normalized: {normalized}")
        
        # Test mock price
        mock_price, mock_change = get_mock_price(normalized)
        if mock_price:
            print(f"  Mock Price: ${mock_price} (change: ${mock_change})")
        else:
            print(f"  Mock Price: Not available")
        
        # Test live price
        print(f"  Fetching live price...")
        live_price, live_change = get_current_price(symbol)
        
        if live_price:
            print(f"  Live Price: ${live_price} (change: ${live_change})")
        else:
            print(f"  Live Price: Failed to fetch")
    
    print("\n" + "=" * 60)
    print("Test completed successfully!")
    
except Exception as e:
    print(f"Error testing market data: {e}")
    import traceback
    traceback.print_exc()