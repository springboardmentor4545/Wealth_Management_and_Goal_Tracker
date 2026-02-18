# backend/app/config.py
import os
from typing import Optional


class Settings:
    """Application configuration settings"""
    
    # Database configuration
    DATABASE_URL: Optional[str] = os.getenv(
        "DATABASE_URL", 
        "postgresql://username:password@localhost/wealth_management"
    )
    
    # API configuration
    USE_MOCK_DATA: bool = os.getenv("USE_MOCK_DATA", "false").lower() == "true"  # Default to false for live data
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Market data settings
    YAHOO_FINANCE_TIMEOUT: int = int(os.getenv("YAHOO_FINANCE_TIMEOUT", "5"))
    CACHE_FAILED_SYMBOLS: bool = os.getenv("CACHE_FAILED_SYMBOLS", "true").lower() == "true"
    
    # Alpha Vantage API settings
    ALPHA_VANTAGE_API_KEY: str = os.getenv("ALPHA_VANTAGE_API_KEY", "SJ23NH6HBUOTDKBT")
    ALPHA_VANTAGE_BASE_URL: str = "https://www.alphavantage.co/query"
    ALPHA_VANTAGE_TIMEOUT: int = int(os.getenv("ALPHA_VANTAGE_TIMEOUT", "10"))
    USE_ALPHA_VANTAGE: bool = os.getenv("USE_ALPHA_VANTAGE", "true").lower() == "true"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_ME_SUPER_SECRET")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


# Create a single instance to be used across the application
settings = Settings()
