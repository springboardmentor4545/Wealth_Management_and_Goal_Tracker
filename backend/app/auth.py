# backend/app/auth.py
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import secrets
import string
from typing import Optional, Dict, List
import uuid

from .database import get_db
from . import models
from .security import verify_password
from .config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# In-memory storage for API keys (in production, use database)
API_KEYS_STORE = {}
USER_API_KEYS = {}  # user_id -> [api_keys]


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token with optional custom expiration"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def generate_api_key() -> str:
    """Generate a secure API key"""
    # Create a 32-character API key with prefix
    key_id = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
    key_secret = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    return f"wm_{key_id}_{key_secret}"


def create_api_key(user_id: int, name: str, expires_in_days: int = 365) -> Dict:
    """Create a new API key for a user"""
    api_key = generate_api_key()
    key_id = str(uuid.uuid4())
    
    expires_at = datetime.utcnow() + timedelta(days=expires_in_days) if expires_in_days > 0 else None
    
    key_data = {
        "id": key_id,
        "key": api_key,
        "user_id": user_id,
        "name": name,
        "created_at": datetime.utcnow(),
        "expires_at": expires_at,
        "last_used_at": None,
        "is_active": True
    }
    
    # Store in memory (in production, save to database)
    API_KEYS_STORE[api_key] = key_data
    
    if user_id not in USER_API_KEYS:
        USER_API_KEYS[user_id] = []
    USER_API_KEYS[user_id].append(key_data)
    
    return {
        "id": key_id,
        "key": api_key,
        "name": name,
        "created_at": key_data["created_at"],
        "expires_at": key_data["expires_at"]
    }


def validate_api_key(api_key: str) -> Optional[models.User]:
    """Validate API key and return associated user"""
    if api_key not in API_KEYS_STORE:
        return None
    
    key_data = API_KEYS_STORE[api_key]
    
    # Check if key is active
    if not key_data["is_active"]:
        return None
    
    # Check if key has expired
    if key_data["expires_at"] and datetime.utcnow() > key_data["expires_at"]:
        return None
    
    # Update last used timestamp
    key_data["last_used_at"] = datetime.utcnow()
    
    # Return user (in production, fetch from database)
    return key_data["user_id"]


def revoke_api_key(key_id: str, user_id: int) -> bool:
    """Revoke an API key"""
    for api_key, key_data in API_KEYS_STORE.items():
        if key_data["id"] == key_id and key_data["user_id"] == user_id:
            key_data["is_active"] = False
            return True
    return False


def list_user_api_keys(user_id: int) -> List[Dict]:
    """List all API keys for a user"""
    if user_id not in USER_API_KEYS:
        return []
    
    return [
        {
            "id": key_data["id"],
            "name": key_data["name"],
            "created_at": key_data["created_at"],
            "expires_at": key_data["expires_at"],
            "last_used_at": key_data["last_used_at"],
            "is_active": key_data["is_active"],
            "key_preview": key_data["key"][:15] + "..." if key_data["is_active"] else "[REVOKED]"
        }
        for key_data in USER_API_KEYS[user_id]
    ]


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
