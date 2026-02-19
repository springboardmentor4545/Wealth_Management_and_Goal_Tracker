from fastapi import APIRouter, HTTPException, Depends
from typing import Dict
from database import get_db_connection
from routes.auth import get_current_user
from services.recommendation_engine import RecommendationEngine
from routes.portfolio import calculate_holdings

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)


# 5. Create Recommendation APIs

@router.get("/allocation")
def get_recommended_allocation(user=Depends(get_current_user)):
    """
    GET recommended allocation based on user's risk profile
    Returns target allocation percentages
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Fetch user's risk profile
        cur.execute("""
            SELECT risk_profile
            FROM users
            WHERE id = %s
        """, (user['id'],))
        
        row = cur.fetchone()
        
        if not row or not row['risk_profile']:
            # Default to moderate if not set
            risk_profile = 'moderate'
        else:
            risk_profile = row['risk_profile']
        
        # Get recommended allocation
        allocation = RecommendationEngine.get_recommended_allocation(risk_profile)
        
        print(f"✅ Generated allocation for {risk_profile} profile")
        
        return {
            "risk_profile": risk_profile,
            "allocation": allocation
        }
        
    except Exception as e:
        print(f"❌ GET ALLOCATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate allocation")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@router.get("/current-allocation")
def get_current_allocation(user=Depends(get_current_user)):
    """
    GET current portfolio allocation
    Calculates actual allocation from holdings
    """
    conn = None
    
    try:
        conn = get_db_connection()
        
        # Get user's holdings
        holdings = calculate_holdings(user['id'], conn, include_market_prices=True)
        
        # Calculate current allocation
        current_allocation = RecommendationEngine.calculate_current_allocation(holdings)
        
        print(f"✅ Calculated current allocation for user {user['id']}")
        
        return {
            "allocation": current_allocation
        }
        
    except Exception as e:
        print(f"❌ GET CURRENT ALLOCATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate current allocation")
    finally:
        if conn:
            conn.close()


@router.get("/rebalance")
def get_rebalancing_suggestions(user=Depends(get_current_user)):
    """
    GET rebalancing suggestions
    Compares current vs recommended allocation
    Returns actionable suggestions (NO AUTO-MODIFICATION)
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get user's risk profile
        cur.execute("""
            SELECT risk_profile
            FROM users
            WHERE id = %s
        """, (user['id'],))
        
        row = cur.fetchone()
        risk_profile = row['risk_profile'] if row and row['risk_profile'] else 'moderate'
        
        # Get holdings
        holdings = calculate_holdings(user['id'], conn, include_market_prices=True)
        
        # Generate full recommendation
        recommendation = RecommendationEngine.generate_full_recommendation(
            risk_profile,
            holdings
        )
        
        print(f"✅ Generated rebalancing suggestions for user {user['id']}")
        
        return recommendation
        
    except Exception as e:
        print(f"❌ GET REBALANCING ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to generate rebalancing suggestions")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@router.get("/full-report")
def get_full_recommendation_report(user=Depends(get_current_user)):
    """
    GET complete recommendation report
    Includes:
    - Risk profile
    - Recommended allocation
    - Current allocation
    - Rebalancing suggestions
    - Portfolio breakdown
    """
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get user info
        cur.execute("""
            SELECT name, email, risk_profile, risk_score
            FROM users
            WHERE id = %s
        """, (user['id'],))
        
        user_info = cur.fetchone()
        risk_profile = user_info['risk_profile'] if user_info['risk_profile'] else 'moderate'
        
        # Get holdings
        holdings = calculate_holdings(user['id'], conn, include_market_prices=True)
        
        # Generate recommendation
        recommendation = RecommendationEngine.generate_full_recommendation(
            risk_profile,
            holdings
        )
        
        # Build complete report
        report = {
            'user': {
                'name': user_info['name'],
                'email': user_info['email'],
                'risk_profile': risk_profile,
                'risk_score': user_info['risk_score']
            },
            'recommendation': recommendation,
            'holdings_count': len(holdings),
            'generated_at': recommendation['generated_at']
        }
        
        print(f"✅ Generated full recommendation report for user {user['id']}")
        
        return report
        
    except Exception as e:
        print(f"❌ GET FULL REPORT ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to generate recommendation report")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()