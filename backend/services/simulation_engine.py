# E2-E4. Simulation Calculation Logic

# backend/services/simulation_engine.py

import math
from typing import Dict, List, Tuple
from datetime import datetime, timedelta
import json


class SimulationEngine:
    """
    Financial simulation engine for what-if analysis
    Calculates future value projections without modifying real portfolio data
    """
    
    @staticmethod
    def calculate_future_value(
        initial_amount: float,
        monthly_contribution: float,
        annual_return_percent: float,
        time_horizon_years: int,
        contribution_increase_percent: float = 0,
        inflation_rate_percent: float = 6.0
    ) -> Dict:
        """
        Calculate future value with detailed projections
        
        Formula:
        FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
        
        Where:
        - PV = Present Value (initial amount)
        - PMT = Payment (monthly contribution)
        - r = Monthly interest rate
        - n = Number of months
        """
        
        # Convert annual rates to monthly
        monthly_rate = annual_return_percent / 100 / 12
        monthly_inflation = inflation_rate_percent / 100 / 12
        total_months = time_horizon_years * 12
        
        # Track projections
        monthly_projections = []
        yearly_projections = []
        
        # Running totals
        current_value = initial_amount
        total_invested = initial_amount
        current_contribution = monthly_contribution
        
        # Calculate month by month
        for month in range(1, total_months + 1):
            # Add monthly contribution
            current_value += current_contribution
            total_invested += current_contribution
            
            # Apply returns
            monthly_return = current_value * monthly_rate
            current_value += monthly_return
            
            # Store monthly projection
            monthly_projections.append({
                'month': month,
                'value': round(current_value, 2),
                'invested': round(total_invested, 2),
                'returns': round(current_value - total_invested, 2),
                'contribution': round(current_contribution, 2)
            })
            
            # Store yearly projection
            if month % 12 == 0:
                year = month // 12
                real_value = current_value / math.pow(1 + (inflation_rate_percent / 100), year)
                
                yearly_projections.append({
                    'year': year,
                    'value': round(current_value, 2),
                    'invested': round(total_invested, 2),
                    'returns': round(current_value - total_invested, 2),
                    'real_value': round(real_value, 2),
                    'inflation_impact': round(current_value - real_value, 2)
                })
            
            # Increase contribution annually
            if month % 12 == 0 and contribution_increase_percent > 0:
                current_contribution *= (1 + contribution_increase_percent / 100)
        
        # Calculate final values
        final_value = current_value
        total_returns = final_value - total_invested
        real_value_adjusted = final_value / math.pow(
            1 + (inflation_rate_percent / 100), 
            time_horizon_years
        )
        
        return {
            'final_value': round(final_value, 2),
            'total_invested': round(total_invested, 2),
            'total_returns': round(total_returns, 2),
            'real_value_adjusted': round(real_value_adjusted, 2),
            'monthly_projections': monthly_projections,
            'yearly_projections': yearly_projections,
            'return_on_investment_percent': round((total_returns / total_invested * 100), 2) if total_invested > 0 else 0,
            'cagr_percent': round((math.pow(final_value / initial_amount, 1 / time_horizon_years) - 1) * 100, 2) if initial_amount > 0 else 0
        }
    
    @staticmethod
    def calculate_required_monthly_contribution(
        target_amount: float,
        initial_amount: float,
        annual_return_percent: float,
        time_horizon_years: int
    ) -> float:
        """
        Calculate how much you need to invest monthly to reach a target
        
        Formula (solving for PMT):
        PMT = (FV - PV * (1 + r)^n) * r / ((1 + r)^n - 1)
        """
        monthly_rate = annual_return_percent / 100 / 12
        total_months = time_horizon_years * 12
        
        if monthly_rate == 0:
            # If no returns, simple division
            return (target_amount - initial_amount) / total_months
        
        fv_from_initial = initial_amount * math.pow(1 + monthly_rate, total_months)
        remaining_needed = target_amount - fv_from_initial
        
        if remaining_needed <= 0:
            return 0  # Initial amount already covers target
        
        annuity_factor = (math.pow(1 + monthly_rate, total_months) - 1) / monthly_rate
        required_contribution = remaining_needed / annuity_factor
        
        return round(required_contribution, 2)
    
    @staticmethod
    def run_simulation(assumptions: Dict) -> Dict:
        """
        Main simulation runner
        Takes assumptions, returns complete results
        """
        # Extract assumptions
        initial_amount = assumptions.get('initial_amount', 0)
        monthly_contribution = assumptions.get('monthly_contribution', 0)
        time_horizon_years = assumptions.get('time_horizon_years', 10)
        expected_return_percent = assumptions.get('expected_return_percent', 12)
        inflation_rate_percent = assumptions.get('inflation_rate_percent', 6)
        target_amount = assumptions.get('target_amount')
        contribution_increase_percent = assumptions.get('contribution_increase_percent', 0)
        
        # Calculate future value
        results = SimulationEngine.calculate_future_value(
            initial_amount=initial_amount,
            monthly_contribution=monthly_contribution,
            annual_return_percent=expected_return_percent,
            time_horizon_years=time_horizon_years,
            contribution_increase_percent=contribution_increase_percent,
            inflation_rate_percent=inflation_rate_percent
        )
        
        # Calculate shortfall/surplus if target provided
        if target_amount:
            shortfall_surplus = results['final_value'] - target_amount
            results['shortfall_surplus'] = round(shortfall_surplus, 2)
            results['target_amount'] = target_amount
            results['achievement_percent'] = round((results['final_value'] / target_amount * 100), 2)
            
            # Calculate required contribution to meet target
            if shortfall_surplus < 0:
                required = SimulationEngine.calculate_required_monthly_contribution(
                    target_amount=target_amount,
                    initial_amount=initial_amount,
                    annual_return_percent=expected_return_percent,
                    time_horizon_years=time_horizon_years
                )
                results['required_monthly_contribution'] = round(required, 2)
        else:
            results['shortfall_surplus'] = 0
        
        # Add calculation metadata
        results['calculation_date'] = datetime.now().isoformat()
        results['assumptions_used'] = assumptions
        
        return results
    
    @staticmethod
    def compare_scenarios(scenarios: List[Dict]) -> Dict:
        """
        Compare multiple scenarios side by side
        """
        comparison = {
            'scenarios': [],
            'best_return': None,
            'lowest_risk': None,
            'most_aggressive': None
        }
        
        for scenario in scenarios:
            results = SimulationEngine.run_simulation(scenario['assumptions'])
            comparison['scenarios'].append({
                'name': scenario.get('name', 'Unnamed'),
                'final_value': results['final_value'],
                'total_returns': results['total_returns'],
                'return_percent': results['return_on_investment_percent']
            })
        
        # Find best scenarios
        if comparison['scenarios']:
            sorted_by_return = sorted(
                comparison['scenarios'], 
                key=lambda x: x['final_value'], 
                reverse=True
            )
            comparison['best_return'] = sorted_by_return[0]['name']
        
        return comparison


# Example usage / testing
if __name__ == "__main__":
    # Test simulation
    assumptions = {
        'initial_amount': 50000,
        'monthly_contribution': 5000,
        'time_horizon_years': 10,
        'expected_return_percent': 12,
        'inflation_rate_percent': 6,
        'target_amount': 1000000,
        'contribution_increase_percent': 5
    }
    
    results = SimulationEngine.run_simulation(assumptions)
    
    print("=" * 50)
    print("SIMULATION RESULTS")
    print("=" * 50)
    print(f"Final Value: ₹{results['final_value']:,.2f}")
    print(f"Total Invested: ₹{results['total_invested']:,.2f}")
    print(f"Total Returns: ₹{results['total_returns']:,.2f}")
    print(f"Real Value (Inflation Adjusted): ₹{results['real_value_adjusted']:,.2f}")
    print(f"Target Amount: ₹{results.get('target_amount', 0):,.2f}")
    print(f"Shortfall/Surplus: ₹{results['shortfall_surplus']:,.2f}")
    print(f"Achievement: {results.get('achievement_percent', 0):.2f}%")
    print(f"CAGR: {results['cagr_percent']:.2f}%")
    
    if 'required_monthly_contribution' in results:
        print(f"\nTo reach target, invest: ₹{results['required_monthly_contribution']:,.2f}/month")
    
    print(f"\nYearly Projections:")
    for year in results['yearly_projections']:
        print(f"  Year {year['year']}: ₹{year['value']:,.2f}")