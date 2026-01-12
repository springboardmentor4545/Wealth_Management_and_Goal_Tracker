from fastapi import APIRouter
from app.api.v1.auth.auth import router as auth_router
from app.api.v1.endpoints import auth, risk, kyc

# Create main router
api_router = APIRouter()

# Include authentication router
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])
api_router.include_router(auth.router)
api_router.include_router(risk.router)
api_router.include_router(kyc.router)

# Add your existing endpoints
@api_router.get("/test")
async def test_endpoint():
    return {"message": "API v1 is working!"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}
