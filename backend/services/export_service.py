import csv
import io
from datetime import datetime
from typing import List, Dict


class ExportService:
    """Service for exporting data to CSV format"""
    
    @staticmethod
    def export_portfolio_holdings_csv(holdings: List[Dict]) -> str:
        """Export portfolio holdings to CSV"""
        output = io.StringIO()
        
        if not holdings:
            return ""
        
        # Define CSV columns
        fieldnames = [
            'Symbol',
            'Units Held',
            'Avg Buy Price',
            'Cost Basis',
            'Current Price',
            'Current Value',
            'Profit/Loss',
            'P&L %'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for holding in holdings:
            writer.writerow({
                'Symbol': holding.get('symbol', ''),
                'Units Held': holding.get('units_held', 0),
                'Avg Buy Price': holding.get('avg_buy_price', 0),
                'Cost Basis': holding.get('cost_basis', 0),
                'Current Price': holding.get('last_price', 0),
                'Current Value': holding.get('current_value', 0),
                'Profit/Loss': holding.get('profit_loss', 0),
                'P&L %': holding.get('profit_loss_percentage', 0)
            })
        
        return output.getvalue()
    
    @staticmethod
    def export_transactions_csv(transactions: List[Dict]) -> str:
        """Export transaction history to CSV"""
        output = io.StringIO()
        
        if not transactions:
            return ""
        
        fieldnames = [
            'Date',
            'Symbol',
            'Type',
            'Quantity',
            'Price',
            'Fees',
            'Total Value'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for txn in transactions:
            writer.writerow({
                'Date': txn.get('executed_at', ''),
                'Symbol': txn.get('symbol', ''),
                'Type': txn.get('type', ''),
                'Quantity': txn.get('quantity', 0),
                'Price': txn.get('price', 0),
                'Fees': txn.get('fees', 0),
                'Total Value': txn.get('total_value', 0)
            })
        
        return output.getvalue()
    
    @staticmethod
    def export_simulations_csv(simulations: List[Dict]) -> str:
        """Export simulations to CSV"""
        output = io.StringIO()
        
        if not simulations:
            return ""
        
        fieldnames = [
            'Scenario Name',
            'Initial Amount',
            'Monthly Contribution',
            'Time Horizon (Years)',
            'Expected Return %',
            'Final Value',
            'Total Returns',
            'Created Date'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for sim in simulations:
            assumptions = sim.get('assumptions', {})
            results = sim.get('results', {})
            
            writer.writerow({
                'Scenario Name': sim.get('scenario_name', ''),
                'Initial Amount': assumptions.get('initial_amount', 0),
                'Monthly Contribution': assumptions.get('monthly_contribution', 0),
                'Time Horizon (Years)': assumptions.get('time_horizon_years', 0),
                'Expected Return %': assumptions.get('expected_return_percent', 0),
                'Final Value': results.get('final_value', 0),
                'Total Returns': results.get('total_returns', 0),
                'Created Date': sim.get('created_at', '')
            })
        
        return output.getvalue()