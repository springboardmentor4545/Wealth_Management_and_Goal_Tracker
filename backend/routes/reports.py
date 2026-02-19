from fastapi import APIRouter, HTTPException, Depends, Response
from database import get_db_connection
from routes.auth import get_current_user
from routes.portfolio import calculate_holdings
from services.export_service import ExportService
from datetime import datetime

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/export/holdings")
def export_holdings_csv(user=Depends(get_current_user)):
    """Export portfolio holdings as CSV"""
    conn = None
    
    try:
        conn = get_db_connection()
        holdings = calculate_holdings(user['id'], conn, include_market_prices=True)
        
        csv_data = ExportService.export_portfolio_holdings_csv(holdings)
        
        filename = f"portfolio_holdings_{datetime.now().strftime('%Y%m%d')}.csv"
        
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        print(f"❌ EXPORT HOLDINGS ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export holdings")
    finally:
        if conn:
            conn.close()


@router.get("/export/transactions")
def export_transactions_csv(user=Depends(get_current_user)):
    """Export transaction history as CSV"""
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, symbol, type, quantity, price, fees, executed_at,
                   (quantity * price + CASE WHEN type = 'buy' THEN fees ELSE -fees END) as total_value
            FROM transactions
            WHERE user_id = %s
            ORDER BY executed_at DESC
        """, (user['id'],))
        
        transactions = cur.fetchall()
        
        csv_data = ExportService.export_transactions_csv(transactions)
        
        filename = f"transactions_{datetime.now().strftime('%Y%m%d')}.csv"
        
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        print(f"❌ EXPORT TRANSACTIONS ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export transactions")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@router.get("/export/simulations")
def export_simulations_csv(user=Depends(get_current_user)):
    """Export simulations as CSV"""
    conn = None
    cur = None
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT scenario_name, assumptions, results, created_at
            FROM simulations
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user['id'],))
        
        simulations = cur.fetchall()
        
        csv_data = ExportService.export_simulations_csv(simulations)
        
        filename = f"simulations_{datetime.now().strftime('%Y%m%d')}.csv"
        
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        print(f"❌ EXPORT SIMULATIONS ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export simulations")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()