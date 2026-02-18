"""
Script to add sample investment data for testing and demonstration
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from decimal import Decimal
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_sample_investments(user_email=None):
    """Add sample investment data for a user"""
    db: Session = SessionLocal()
    
    try:
        # Find the user - if no email provided, use first user
        if user_email:
            user = db.query(models.User).filter(models.User.email == user_email).first()
        else:
            user = db.query(models.User).first()
            
        if not user:
            logger.error("No user found in database!")
            return
        
        logger.info(f"Adding sample data for user: {user.name} ({user.email})")
        
        # Sample Indian stocks with realistic data
        sample_stocks = [
            {
                "asset_name": "Reliance Industries Ltd",
                "symbol": "RELIANCE.NS",
                "asset_type": "equity",
                "quantity": 50,
                "price": 2450.75
            },
            {
                "asset_name": "Tata Consultancy Services",
                "symbol": "TCS.NS", 
                "asset_type": "equity",
                "quantity": 25,
                "price": 3589.20
            },
            {
                "asset_name": "HDFC Bank Ltd",
                "symbol": "HDFCBANK.NS",
                "asset_type": "equity", 
                "quantity": 75,
                "price": 1634.85
            },
            {
                "asset_name": "Infosys Ltd",
                "symbol": "INFY.NS",
                "asset_type": "equity",
                "quantity": 100,
                "price": 1456.30
            },
            {
                "asset_name": "ICICI Bank Ltd",
                "symbol": "ICICIBANK.NS",
                "asset_type": "equity",
                "quantity": 60,
                "price": 1089.45
            },
            {
                "asset_name": "State Bank of India",
                "symbol": "SBIN.NS",
                "asset_type": "equity",
                "quantity": 200,
                "price": 612.90
            },
            {
                "asset_name": "Bharti Airtel Ltd",
                "symbol": "BHARTIARTL.NS", 
                "asset_type": "equity",
                "quantity": 150,
                "price": 1023.75
            },
            {
                "asset_name": "ITC Ltd",
                "symbol": "ITC.NS",
                "asset_type": "equity",
                "quantity": 300,
                "price": 456.20
            },
            {
                "asset_name": "Larsen & Toubro Ltd",
                "symbol": "LT.NS",
                "asset_type": "equity",
                "quantity": 40,
                "price": 3245.60
            },
            {
                "asset_name": "Wipro Ltd",
                "symbol": "WIPRO.NS",
                "asset_type": "equity", 
                "quantity": 120,
                "price": 432.85
            },
            {
                "asset_name": "Maruti Suzuki India Ltd",
                "symbol": "MARUTI.NS",
                "asset_type": "equity",
                "quantity": 15,
                "price": 10234.50
            },
            {
                "asset_name": "Asian Paints Ltd",
                "symbol": "ASIANPAINT.NS",
                "asset_type": "equity",
                "quantity": 35,
                "price": 2987.40
            }
        ]
        
        # Remove any existing sample data first
        existing_investments = db.query(models.Investment).filter(
            models.Investment.user_id == user.id
        ).all()
        
        for investment in existing_investments:
            # Delete transactions first
            db.query(models.Transaction).filter(
                models.Transaction.investment_id == investment.id
            ).delete(synchronize_session=False)
            # Delete investment
            db.delete(investment)
        
        db.commit()
        logger.info(f"Cleaned up {len(existing_investments)} existing investments")
        
        # Add new sample investments
        for stock_data in sample_stocks:
            # Create investment
            investment = models.Investment(
                user_id=user.id,
                asset_name=stock_data["asset_name"],
                symbol=stock_data["symbol"],
                asset_type=stock_data["asset_type"],
                average_price=Decimal(str(stock_data["price"])),
                total_quantity=Decimal(str(stock_data["quantity"]))
            )
            
            db.add(investment)
            db.flush()  # To get the investment ID
            
            # Create a buy transaction
            transaction = models.Transaction(
                investment_id=investment.id,
                user_id=user.id,
                transaction_type=models.TransactionTypeEnum.buy,
                quantity=Decimal(str(stock_data["quantity"])),
                price=Decimal(str(stock_data["price"]))
            )
            
            db.add(transaction)
            logger.info(f"Added: {stock_data['asset_name']} - {stock_data['quantity']} units @ ₹{stock_data['price']}")
        
        db.commit()
        logger.info(f"Successfully added {len(sample_stocks)} sample investments!")
        
        # Show portfolio summary
        total_value = sum(stock["quantity"] * stock["price"] for stock in sample_stocks)
        logger.info(f"Total portfolio value: ₹{total_value:,.2f}")
        
    except Exception as e:
        logger.error(f"Error adding sample data: {str(e)}")
        db.rollback()
        raise
    
    finally:
        db.close()


def list_user_portfolio(user_email=None):
    """List current portfolio for a user"""
    db: Session = SessionLocal()
    
    try:
        if user_email:
            user = db.query(models.User).filter(models.User.email == user_email).first()
        else:
            user = db.query(models.User).first()
            
        if not user:
            logger.error("No user found in database!")
            return
        
        investments = db.query(models.Investment).filter(
            models.Investment.user_id == user.id
        ).all()
        
        logger.info(f"Portfolio for {user.name} ({user.email}):")
        logger.info(f"Total investments: {len(investments)}")
        
        total_value = 0
        for investment in investments:
            value = investment.total_quantity * investment.average_price
            total_value += float(value)
            logger.info(f"  {investment.asset_name} ({investment.symbol}): {investment.total_quantity} units @ ₹{investment.average_price} = ₹{value:,.2f}")
        
        logger.info(f"Total Portfolio Value: ₹{total_value:,.2f}")
        
    except Exception as e:
        logger.error(f"Error listing portfolio: {str(e)}")
    
    finally:
        db.close()


if __name__ == "__main__":
    # Auto-run with first available user
    logger.info("Finding first available user...")
    
    # Show current portfolio
    logger.info("\n=== CURRENT PORTFOLIO ===")
    list_user_portfolio()
    
    # Automatically add sample data
    logger.info("\n=== ADDING SAMPLE DATA ===")
    add_sample_investments()
    
    logger.info("\n=== NEW PORTFOLIO ===")
    list_user_portfolio()