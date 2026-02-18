#!/usr/bin/env python3
"""
Quick test script for live price functionality
"""

import requests
import json
import time

API_BASE = "http://127.0.0.1:8000"

def test_live_prices():
    """Test the live price functionality""" 
    print("🧪 Testing Live Price Functionality")
    print("=" * 50)
    
    # Test symbols (mix of real and mock)
    test_symbols = ["TCS.NS", "RELIANCE.NS", "WIPRO.NS", "INFY.NS", "AAPL"]
    
    for symbol in test_symbols:
        print(f"\n📊 Testing {symbol}...")
        
        try:
            response = requests.get(f"{API_BASE}/test-live-price/{symbol}", timeout=10)
            data = response.json()
            
            if response.status_code == 200:
                if data["status"] == "success":
                    price = data["price"]
                    change = data["change"]
                    using_mock = data["using_mock_data"]
                    
                    print(f"  ✅ SUCCESS")
                    print(f"  💰 Price: {price}")
                    print(f"  📈 Change: {change}")
                    print(f"  🎭 Mock Data: {using_mock}")
                else:
                    print(f"  ❌ NO DATA: {data.get('status')}")
            else:
                print(f"  ❌ ERROR: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ EXCEPTION: {str(e)}")
        
        # Small delay between requests
        time.sleep(0.5)
    
    print("\n" + "=" * 50)
    print("✅ Live price test completed!")

def test_server_status():
    """Test if the server is running and accessible"""
    print("🏥 Testing Server Health...")
    
    try:
        response = requests.get(f"{API_BASE}/docs", timeout=5)
        if response.status_code == 200:
            print("  ✅ Server is running")
            return True
        else:
            print(f"  ❌ Server returned {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Server not accessible: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Wealth Management Live Price Tester")
    print("=" * 60)
    
    if test_server_status():
        test_live_prices()
    else:
        print("\n❌ Cannot test - server is not running")
        print("   Start the server with: python -m uvicorn app.main:app --reload")