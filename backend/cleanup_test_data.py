"""
Cleanup script for removing invalid test data from the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cleanup_test_investments():
    """Remove investments with invalid test symbols"""
    db: Session = SessionLocal()
    
    try:
        # List of known test/invalid symbols to remove
        invalid_symbols = [
            'QWERTYUJ.NS',
            'TESTSTOCK.NS', 
            'INVALID.NS',
            'DUMMY.NS'
        ]
        
        for symbol in invalid_symbols:
            # Find investments with this symbol
            investments = db.query(models.Investment).filter(
                models.Investment.symbol == symbol
            ).all()
            
            if investments:
                logger.info(f"Found {len(investments)} investments with invalid symbol: {symbol}")
                
                for investment in investments:
                    # Delete related transactions first
                    transactions = db.query(models.Transaction).filter(
                        models.Transaction.investment_id == investment.id
                    ).all()
                    
                    logger.info(f"Deleting {len(transactions)} transactions for investment {investment.id}")
                    for transaction in transactions:
                        db.delete(transaction)
                    
                    # Delete the investment
                    logger.info(f"Deleting investment: {investment.asset_name} ({investment.symbol})")
                    db.delete(investment)
                
                db.commit()
                logger.info(f"Successfully cleaned up symbol: {symbol}")
            else:
                logger.info(f"No investments found with symbol: {symbol}")
    
    except Exception as e:
        logger.error(f"Error during cleanup: {str(e)}")
        db.rollback()
    
    finally:
        db.close()


def list_all_symbols():
    """List all unique symbols in the database for review"""
    db: Session = SessionLocal()
    
    try:
        symbols = db.query(models.Investment.symbol).distinct().all()
        logger.info("All symbols in database:")
        for symbol_tuple in symbols:
            symbol = symbol_tuple[0]
            count = db.query(models.Investment).filter(
                models.Investment.symbol == symbol
            ).count()
            logger.info(f"  {symbol} - {count} investments")
    
    except Exception as e:
        logger.error(f"Error listing symbols: {str(e)}")
    
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Starting database cleanup...")
    
    # First list all symbols
    list_all_symbols()
    
    # Ask for confirmation
    response = input("\nDo you want to proceed with cleanup? (y/N): ")
    if response.lower() == 'y':
        cleanup_test_investments()
        logger.info("Cleanup completed!")
        
        # List symbols again to verify
        logger.info("\nSymbols after cleanup:")
        list_all_symbols()
    else:
        logger.info("Cleanup cancelled.")