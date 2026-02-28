import os
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

from . import models, schemas, database, crud, auth
from . import risk_questions
from .routers import goals, portfolio, simulations # Import routers

app = FastAPI()

app.include_router(goals.router)
app.include_router(portfolio.router)
app.include_router(simulations.router) # Include simulations router

# Allow cross-origin requests from frontend (development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables
models.Base.metadata.create_all(bind=database.engine)


@app.post("/auth/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing = crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(db, user_in)
    return user


@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = crud.authenticate_user(db, form_data.email, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = auth.create_access_token({"sub": user.email})
    refresh_token = auth.create_refresh_token({"sub": user.email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.post("/auth/refresh", response_model=schemas.Token)
def refresh(token_in: schemas.RefreshToken):
    try:
        payload = auth.verify_refresh_token(token_in.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    access_token = auth.create_access_token({"sub": email})
    refresh_token = auth.create_refresh_token({"sub": email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@app.get("/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.get("/risk/questions")
def get_risk_questions():
    return {"questions": risk_questions.questions}


import json
@app.post("/users/me/risk", response_model=schemas.UserOut)
def submit_risk(payload: dict = Body(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    answers = payload.get('answers', [])
    notes = payload.get('notes')
    try:
        total = sum(int(x) for x in answers)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid answers format")
    category = risk_questions.compute_category(total, answers)
    allocation_dict = risk_questions.get_allocation(category)
    allocation_str = json.dumps(allocation_dict)
    user = crud.update_user_risk(db, current_user, total, category, notes, allocation_str)
    return user


@app.patch("/users/me/kyc", response_model=schemas.UserOut)
def patch_kyc(payload: dict = Body(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    status = payload.get('kyc_status')
    if status not in ("verified", "unverified"):
        raise HTTPException(status_code=400, detail="kyc_status must be 'verified' or 'unverified'")
    user = crud.set_kyc_status(db, current_user, status)
    return user

@app.get("/dashboard/summary")
def get_dashboard_summary(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    from . import risk_questions
    
    # 1. Fetch Portfolio & Calculate Total Wealth FIRST
    investments = db.query(models.Investment).filter(models.Investment.user_id == current_user.id).all()
    
    total_invested = 0
    total_market_val = 0
    current_alloc = {}
    
    for inv in investments:
        mkt_val = inv.current_value or (inv.quantity * inv.last_price)
        cost_basis = inv.quantity * inv.average_buy_price
        
        total_invested += cost_basis
        total_market_val += mkt_val
        
        # --- SMART OVERRIDE ---
        symbol = inv.symbol.upper().strip()
        if symbol in ["BND", "TLT", "AGG"]:
            asset_type = "Bonds"
        elif symbol in ["BTC", "ETH", "SOL"]:
            asset_type = "Crypto"
        else:
            asset_type = inv.asset_type.capitalize() if inv.asset_type else "Stocks"
            if asset_type == "Stock": asset_type = "Stocks"
            elif asset_type == "Bond": asset_type = "Bonds"
            
        current_alloc[asset_type] = current_alloc.get(asset_type, 0) + mkt_val

    # 2. Goals Progress Data (Now dynamically linked to live wealth)
    goals = db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()
    goals_data = []
    
    for g in goals:
        # Use total_market_val instead of the static g.current_amount
        raw_pct = (total_market_val / g.target_amount * 100) if g.target_amount > 0 else 0
        
        goals_data.append({
            "name": g.title,
            # We use min(pct, 100) to cap the bar at 100% so it doesn't break your UI design
            "pct": min(round(raw_pct, 1), 100) 
        })

    wealth_history = [
        {"name": "Start", "invested": 0, "value": 0},
        {"name": "Current", "invested": round(total_invested, 2), "value": round(total_market_val, 2)}
    ]

    # 3. Allocation Target vs Actual
    target_alloc = risk_questions.get_allocation(current_user.risk_category)
    allocation_data = []
    
    for asset_type, target_pct in target_alloc.items():
        try:
            clean_target = float(str(target_pct).replace('%', '').strip())
        except ValueError:
            clean_target = 0.0

        actual_val = current_alloc.get(asset_type, 0)
        actual_pct = round((actual_val / total_market_val * 100), 1) if total_market_val > 0 else 0
        allocation_data.append({
            "asset": asset_type,
            "actual": actual_pct,
            "target": clean_target
        })

    return {
        "goals": goals_data,
        "wealth_history": wealth_history,
        "allocation": allocation_data
    }