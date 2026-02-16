from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routes import user_routes, goal_routes, portfolio_routes, simulations_routes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Wealth Management Backend")

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(user_routes.router, prefix="/user")
app.include_router(goal_routes.router, prefix="/goals")
app.include_router(portfolio_routes.router, prefix="/portfolio") 
app.include_router(simulations_routes.router, prefix="/simulations") 

@app.get("/")
def root():
    return {"message": "FastAPI backend running ✅"}
