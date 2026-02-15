from celery_config import celery_app
from database import get_db_connection
from services.market_data import update_investment_prices
from datetime import datetime, timedelta

@celery_app.task(name='tasks.market_tasks.update_all_prices')
def update_all_prices():
    """
    Background task to update all investment prices
    Runs on schedule (every 15 minutes or nightly)
    """
    print(f"🔄 Starting scheduled price update at {datetime.now()}")
    
    conn = None
    try:
        conn = get_db_connection()
        result = update_investment_prices(conn)
        
        print(f"✅ Price update completed: {result}")
        return {
            'status': 'success',
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error in scheduled price update: {str(e)}")
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
    finally:
        if conn:
            conn.close()


@celery_app.task(name='tasks.market_tasks.update_user_prices')
def update_user_prices(user_id: int):
    """
    Background task to update specific user's investment prices
    Can be triggered on-demand
    """
    print(f"🔄 Updating prices for user {user_id}")
    
    conn = None
    try:
        conn = get_db_connection()
        result = update_investment_prices(conn, user_id)
        
        print(f"✅ User {user_id} price update completed")
        return {
            'status': 'success',
            'user_id': user_id,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error updating user {user_id} prices: {str(e)}")
        return {
            'status': 'error',
            'user_id': user_id,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
    finally:
        if conn:
            conn.close()


@celery_app.task(name='tasks.market_tasks.cleanup_old_data')
def cleanup_old_data():
    """
    Clean up old price data and cache
    Runs daily
    """
    print(f"🧹 Starting daily cleanup at {datetime.now()}")
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Archive old price data (older than 30 days)
        cutoff_date = datetime.now() - timedelta(days=30)
        
        # Could add logic here to move old data to archive table
        # For now, just log
        print(f"ℹ️ Would archive data older than {cutoff_date}")
        
        return {
            'status': 'success',
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Error in cleanup: {str(e)}")
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
    finally:
        if conn:
            conn.close()


@celery_app.task(name='tasks.market_tasks.refresh_prices_now')
def refresh_prices_now():
    """
    Immediate price refresh (can be triggered from API)
    """
    print(f"⚡ Immediate price refresh requested at {datetime.now()}")
    return update_all_prices()