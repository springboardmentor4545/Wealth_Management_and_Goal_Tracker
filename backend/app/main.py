from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from .goals import router as goals_router
from .auth_routes import router as auth_router

from .database import Base, engine, get_db
from . import models, schemas
from .auth import create_access_token, get_current_user
from .security import verify_password, get_password_hash
from .portfolio import router as portfolio_router
from .simulations import router as simulations_router
from .config import settings
import logging

# Configure logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL, logging.INFO))
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Wealth Management API",
    description="Personal wealth management and portfolio tracking",
    version="1.0.0"
)

# Log startup configuration
logger.info("🚀 Starting Wealth Management API")
logger.info(f"📊 Mock Data Mode: {'ENABLED' if settings.USE_MOCK_DATA else 'DISABLED'}")
logger.info(f"🐛 Debug Mode: {'ENABLED' if settings.DEBUG else 'DISABLED'}")
logger.info(f"🔑 Secret Key: {settings.SECRET_KEY[:10]}...")
if settings.USE_MOCK_DATA:
    logger.warning("⚠️  Using MOCK data for market prices - disable USE_MOCK_DATA for production")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/test-login-page")
def serve_login_test_page():
    """
    Serve a login test page for debugging authentication issues.
    """
    html_content = """<!DOCTYPE html>
<html>
<head>
    <title>Login Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: white; }
        .container { max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input, button { padding: 10px; width: 100%; margin-bottom: 10px; }
        button { background: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
        .result { background: #333; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .error { color: #ff6b6b; }
        .success { color: #51cf66; }
        .test-accounts { background: #2a2a2a; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .test-accounts h3 { margin-top: 0; color: #51cf66; }
        .account { margin-bottom: 10px; padding: 8px; background: #3a3a3a; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Login Test Tool</h1>
        <p>Test the login functionality directly</p>
        
        <div class="test-accounts">
            <h3>📧 Available Test Accounts</h3>
            <div class="account"><strong>ananthulamanikanta5@gmail.com</strong> - password: password123</div>
            <div class="account"><strong>vinay@gmail.com</strong> - password: password123</div>
            <div class="account"><strong>sampath@gmail.com</strong> - password: password123</div>
            <div class="account"><strong>demo@example.com</strong> - password: password123</div>
            <div class="account"><strong>test@example.com</strong> - password: password123</div>
        </div>

        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" value="ananthulamanikanta5@gmail.com" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" value="password123" required>
            </div>
            
            <button type="submit">🚀 Test Login</button>
        </form>

        <div id="result" class="result" style="display: none;"></div>

        <div style="margin-top: 30px;">
            <h3>🔧 Quick Actions</h3>
            <button onclick="testHealth()">Test Backend Health</button>
            <button onclick="clearStorage()">Clear Browser Storage</button>
            <button onclick="goToMainApp()">Go to Main App</button>
        </div>
    </div>

    <script>
        const API_URL = "http://localhost:8000";
        
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const resultDiv = document.getElementById('result');
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = 'Testing login...';
            resultDiv.className = 'result';
            
            try {
                const body = new URLSearchParams();
                body.append('username', email);
                body.append('password', password);
                
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: body
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('access_token', data.access_token);
                    
                    resultDiv.innerHTML = `
                        <div class="success">✅ LOGIN SUCCESSFUL!</div>
                        <p><strong>Token:</strong> ${data.access_token.substring(0, 50)}...</p>
                        <p><strong>Stored in localStorage:</strong> ✅</p>
                        <button onclick="goToMainApp()" style="margin-top: 10px;">Go to Dashboard</button>
                    `;
                    resultDiv.className = 'result success';
                } else {
                    resultDiv.innerHTML = `
                        <div class="error">❌ LOGIN FAILED</div>
                        <p><strong>Status:</strong> ${response.status}</p>
                        <p><strong>Error:</strong> ${data.detail || 'Unknown error'}</p>
                    `;
                    resultDiv.className = 'result error';
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="error">❌ NETWORK ERROR</div>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Backend server might not be running on port 8000</p>
                `;
                resultDiv.className = 'result error';
            }
        });
        
        async function testHealth() {
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = 'Testing backend health...';
            resultDiv.className = 'result';
            
            try {
                const response = await fetch(`${API_URL}/health`);
                const data = await response.json();
                
                if (response.ok) {
                    resultDiv.innerHTML = `
                        <div class="success">✅ BACKEND HEALTHY</div>
                        <p><strong>Status:</strong> ${data.status}</p>
                    `;
                    resultDiv.className = 'result success';
                } else {
                    resultDiv.innerHTML = `<div class="error">❌ Backend health check failed</div>`;
                    resultDiv.className = 'result error';
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="error">❌ BACKEND NOT RESPONDING</div>
                    <p><strong>Error:</strong> ${error.message}</p>
                `;
                resultDiv.className = 'result error';
            }
        }
        
        function clearStorage() {
            localStorage.clear();
            sessionStorage.clear();
            document.getElementById('result').style.display = 'block';
            document.getElementById('result').innerHTML = '🧹 Browser storage cleared!';
            document.getElementById('result').className = 'result success';
        }
        
        function goToMainApp() {
            window.open('http://localhost:3000', '_blank');
        }
        
        window.onload = () => testHealth();
    </script>
</body>
</html>"""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html_content)

@app.get("/health")
def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "message": "Server is running"}

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    try:
        print(f"=== LOGIN ATTEMPT ===")
        print(f"Email: {form_data.username}")
        print(f"Password length: {len(form_data.password)}")
        
        user = db.query(models.User).filter(
            models.User.email == form_data.username
        ).first()

        if not user:
            print("❌ User not found in database")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        print(f"✅ User found - ID: {user.id}, Email: {user.email}")
        print(f"🔑 Stored password hash: {user.password[:50]}...")
        print(f"🔐 Password hash algorithm: {user.password[:9] if user.password else 'None'}")
        print(f"🔐 Attempting to verify password...")
        
        try:
            password_valid = verify_password(form_data.password, user.password)
            print(f"Password verification result: {password_valid}")
        except Exception as e:
            print(f"❌ Password verification error: {str(e)}")
            raise HTTPException(status_code=500, detail="Authentication error")
        
        if not password_valid:
            print("❌ Password verification failed")
            # Additional debugging for failed passwords
            print(f"🔍 Debug - Raw password: {repr(form_data.password)}")
            print(f"🔍 Debug - Hash length: {len(user.password) if user.password else 0}")
            raise HTTPException(status_code=401, detail="Invalid credentials")

        print("✅ Authentication successful")
        token = create_access_token({"sub": str(user.id)})
        return {"access_token": token, "token_type": "bearer"}
    
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        print(f"❌ Unexpected error in login: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error during authentication")

@app.post("/portfolio/live-config")
def configure_live_prices(
    payload: dict,  # {"use_live_data": bool, "auto_refresh_seconds": int}
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """
    Toggle between live market data and mock data for a user.
    """
    use_live_data = payload.get("use_live_data", True)
    auto_refresh_seconds = payload.get("auto_refresh_seconds", 30)
    
    # Store user preference (you might want to add this to user model)
    return {
        "use_live_data": use_live_data,
        "auto_refresh_seconds": auto_refresh_seconds,
        "message": f"Live data {'enabled' if use_live_data else 'disabled'}"
    }

@app.get("/debug/list-users")
def list_all_users(db: Session = Depends(get_db)):
    """
    Debug endpoint to list all users in the database.
    Remove this in production!
    """
    try:
        users = db.query(models.User).all()
        user_list = []
        for user in users:
            user_list.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "created_at": user.created_at,
                "password_hash_preview": user.password[:20] + "..." if user.password else "None"
            })
        
        return {
            "total_users": len(users),
            "users": user_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing users: {str(e)}")

@app.post("/debug/reset-all-passwords")
def reset_all_passwords(
    payload: dict,  # {"new_password": str}
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to reset ALL user passwords to the same password.
    Remove this in production!
    """
    try:
        new_password = payload.get("new_password")
        if not new_password:
            raise HTTPException(status_code=400, detail="new_password required")
        
        users = db.query(models.User).all()
        updated_users = []
        
        # Hash the new password once
        new_hash = get_password_hash(new_password)
        
        for user in users:
            user.password = new_hash
            updated_users.append({
                "id": user.id,
                "email": user.email,
                "name": user.name
            })
        
        db.commit()
        
        return {
            "message": f"Reset passwords for {len(users)} users", 
            "new_password": new_password,
            "updated_users": updated_users,
            "hash_preview": new_hash[:20] + "..."
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting passwords: {str(e)}")

@app.post("/debug/reset-password")
def reset_user_password(
    payload: dict,  # {"email": str, "new_password": str}
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to reset a user's password.
    Remove this in production!
    """
    try:
        email = payload.get("email")
        new_password = payload.get("new_password")
        
        if not email or not new_password:
            raise HTTPException(status_code=400, detail="Email and new_password required")
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Hash the new password
        new_hash = get_password_hash(new_password)
        user.password = new_hash
        db.commit()
        
        return {
            "message": "Password reset successfully", 
            "user_id": user.id,
            "new_hash_preview": new_hash[:20] + "..."
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting password: {str(e)}")


@app.post("/debug/user-exists/{email}")
def check_user_exists(email: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        return {
            "exists": True,
            "user_id": user.id,
            "email": user.email,
            "created_at": user.created_at,
            "password_hash_preview": user.password[:20] + "..."
        }
    return {"exists": False}

@app.get("/me", response_model=schemas.UserProfileResponse)
def get_me(user: models.User = Depends(get_current_user)):
    return user

@app.put("/profile", response_model=schemas.UserProfileResponse)
def update_user_profile(
    payload: schemas.UserProfileUpdateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """
    Update user profile - risk_profile and kyc_status
    """
    try:
        logger.info(f"Updating profile for user {user.id}: {payload}")
        
        if payload.risk_profile is not None:
            user.risk_profile = payload.risk_profile
            
        if payload.kyc_status is not None:
            user.kyc_status = payload.kyc_status
        
        # Mark profile as completed if both fields are set
        if user.risk_profile and user.kyc_status:
            user.profile_completed = True
        
        db.commit()
        db.refresh(user)
        
        logger.info(f"Profile updated successfully for user {user.id}")
        return user
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating profile for user {user.id}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to update profile: {str(e)}"
        )

# ===== ALPHA VANTAGE ENDPOINTS =====

@app.get("/market-data/alpha-vantage/quote/{symbol}")
async def get_alpha_vantage_quote(
    symbol: str,
    user: models.User = Depends(get_current_user)
):
    """
    Get real-time stock quote from Alpha Vantage
    """
    try:
        from .market_data import get_alpha_vantage_stock_data
        
        logger.info(f"Alpha Vantage quote request for {symbol} by user {user.id}")
        
        stock_data = await get_alpha_vantage_stock_data(symbol)
        
        if not stock_data:
            raise HTTPException(
                status_code=404,
                detail=f"Stock data not found for symbol: {symbol}"
            )
        
        return {
            "symbol": symbol,
            "data": stock_data,
            "source": "alpha_vantage",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching Alpha Vantage quote for {symbol}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch stock data: {str(e)}"
        )

@app.post("/market-data/alpha-vantage/batch")
async def get_alpha_vantage_batch(
    payload: dict,  # {"symbols": ["AAPL", "GOOGL", "MSFT"]}
    user: models.User = Depends(get_current_user)
):
    """
    Get Alpha Vantage data for multiple symbols
    """
    try:
        from .market_data import get_multiple_alpha_vantage_data
        
        symbols = payload.get("symbols", [])
        if not symbols:
            raise HTTPException(
                status_code=400,
                detail="No symbols provided"
            )
        
        if len(symbols) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 symbols allowed per batch request"
            )
        
        logger.info(f"Alpha Vantage batch request for {len(symbols)} symbols by user {user.id}")
        
        batch_data = await get_multiple_alpha_vantage_data(symbols)
        
        return {
            "symbols": symbols,
            "data": batch_data,
            "source": "alpha_vantage",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in Alpha Vantage batch request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch batch stock data: {str(e)}"
        )

@app.get("/market-data/enhanced-portfolio")
def get_enhanced_portfolio_data_endpoint(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get enhanced portfolio data with Alpha Vantage integration
    """
    try:
        from .market_data import get_enhanced_portfolio_data
        
        logger.info(f"Enhanced portfolio data request by user {user.id}")
        
        # Get user's investments
        investments = db.query(models.Investment).filter_by(user_id=user.id).all()
        
        if not investments:
            return {
                "message": "No investments found",
                "data": {},
                "timestamp": datetime.now().isoformat()
            }
        
        symbols = [inv.symbol for inv in investments if inv.symbol]
        
        enhanced_data = get_enhanced_portfolio_data(symbols)
        
        # Enrich with investment data
        portfolio_data = {}
        for investment in investments:
            symbol = investment.symbol
            market_data = enhanced_data.get(symbol)
            
            portfolio_item = {
                "investment_id": investment.id,
                "asset_name": investment.asset_name,
                "symbol": symbol,
                "quantity": float(investment.total_quantity or 0),
                "average_price": float(investment.average_price or 0),
                "market_data": market_data
            }
            
            if market_data:
                current_price = float(market_data.get('price', 0))
                portfolio_item["current_value"] = portfolio_item["quantity"] * current_price
                portfolio_item["total_gain_loss"] = portfolio_item["current_value"] - (portfolio_item["quantity"] * portfolio_item["average_price"])
                portfolio_item["gain_loss_percent"] = (
                    ((current_price - portfolio_item["average_price"]) / portfolio_item["average_price"] * 100)
                    if portfolio_item["average_price"] > 0 else 0
                )
            
            portfolio_data[symbol] = portfolio_item
        
        return {
            "portfolio_data": portfolio_data,
            "total_symbols": len(symbols),
            "successful_fetches": len([d for d in enhanced_data.values() if d is not None]),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in enhanced portfolio data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch enhanced portfolio data: {str(e)}"
        )

@app.get("/market-data/cache-stats")
def get_market_data_cache_stats(
    user: models.User = Depends(get_current_user)
):
    """
    Get cache statistics for market data services
    """
    try:
        from .market_data import get_cache_stats
        from .alpha_vantage_service import get_alpha_vantage_cache_stats
        
        yahoo_stats = get_cache_stats()
        alpha_vantage_stats = get_alpha_vantage_cache_stats()
        
        return {
            "yahoo_finance": yahoo_stats,
            "alpha_vantage": alpha_vantage_stats,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch cache statistics"
        )

app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(goals_router)
app.include_router(simulations_router)
