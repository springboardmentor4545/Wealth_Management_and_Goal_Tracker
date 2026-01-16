import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()


from . import models, schemas, database, crud, auth
from . import risk_questions
from .routers import goals, portfolio # Import portfolio router
from fastapi import Body

app = FastAPI()

app.include_router(goals.router)
app.include_router(goals.router)
app.include_router(portfolio.router) # Include portfolio router

# Force server reload for portfolio update 2


# Allow cross-origin requests from frontend (development)
# in backend/app/main.py (recommended)
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
    # expected payload: { "answers": [0,5,10,...], "notes": "optional" }
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
