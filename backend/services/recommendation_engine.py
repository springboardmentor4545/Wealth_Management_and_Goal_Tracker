from typing import Dict, List
from datetime import datetime


class RecommendationEngine:
    """
    Asset allocation and rebalancing recommendation engine
    Based on user risk profile and current portfolio allocation
    """
    
    # 1. Asset Allocation Strategy - Define allocation rules
    ALLOCATION_STRATEGIES = {
        'conservative': {
            'equity': 30,
            'debt': 50,
            'cash': 20,
            'description': 'Low risk, stable returns, capital preservation'
        },
        'moderate': {
            'equity': 60,
            'debt': 30,
            'cash': 10,
            'description': 'Balanced risk-return, moderate growth'
        },
        'aggressive': {
            'equity': 80,
            'debt': 15,
            'cash': 5,
            'description': 'High risk, high return potential, long-term growth'
        }
    }
    
    # Asset category mapping
    ASSET_CATEGORIES = {
        'equity': ['stock', 'etf', 'equity', 'shares'],
        'debt': ['bond', 'debt', 'fixed_deposit', 'fd'],
        'cash': ['cash', 'savings', 'liquid']
    }
    
    @staticmethod
    def get_recommended_allocation(risk_profile: str) -> Dict:
        """
        2. Risk-Based Allocation Logic
        Map risk profile to recommended allocation
        
        Args:
            risk_profile: 'conservative', 'moderate', or 'aggressive'
        
        Returns:
            Allocation percentages and description
        """
        risk_profile = risk_profile.lower()
        
        if risk_profile not in RecommendationEngine.ALLOCATION_STRATEGIES:
            # Default to moderate if invalid
            risk_profile = 'moderate'
        
        allocation = RecommendationEngine.ALLOCATION_STRATEGIES[risk_profile].copy()
        allocation['risk_profile'] = risk_profile
        allocation['generated_at'] = datetime.now().isoformat()
        
        return allocation
    
    @staticmethod
    def calculate_current_allocation(holdings: List[Dict]) -> Dict:
        """
        3. Calculate Current Portfolio Allocation
        Analyze user's investments and calculate allocation percentages
        
        Args:
            holdings: List of investment holdings with current values
        
        Returns:
            Current allocation percentages
        """
        if not holdings:
            return {
                'equity': 0,
                'debt': 0,
                'cash': 0,
                'total_value': 0,
                'breakdown': []
            }
        
        # Calculate total portfolio value
        total_value = sum(h.get('current_value', 0) for h in holdings)
        
        if total_value == 0:
            return {
                'equity': 0,
                'debt': 0,
                'cash': 0,
                'total_value': 0,
                'breakdown': []
            }
        
        # Initialize category totals
        category_values = {
            'equity': 0,
            'debt': 0,
            'cash': 0
        }
        
        # Categorize each holding
        breakdown = []
        for holding in holdings:
            symbol = holding.get('symbol', '').lower()
            asset_type = holding.get('asset_type', '').lower()
            current_value = holding.get('current_value', 0)
            
            # Determine category
            category = 'equity'  # Default
            
            for cat, keywords in RecommendationEngine.ASSET_CATEGORIES.items():
                if any(keyword in symbol or keyword in asset_type for keyword in keywords):
                    category = cat
                    break
            
            category_values[category] += current_value
            
            breakdown.append({
                'symbol': holding.get('symbol'),
                'category': category,
                'value': current_value,
                'percentage': round((current_value / total_value * 100), 2)
            })
        
        # Calculate percentages
        allocation = {
            'equity': round((category_values['equity'] / total_value * 100), 2),
            'debt': round((category_values['debt'] / total_value * 100), 2),
            'cash': round((category_values['cash'] / total_value * 100), 2),
            'total_value': round(total_value, 2),
            'breakdown': breakdown
        }
        
        return allocation
    
    @staticmethod
    def generate_rebalancing_suggestions(
        current_allocation: Dict,
        recommended_allocation: Dict
    ) -> Dict:
        """
        4. Build Rebalancing Logic
        Compare current vs recommended allocation
        Generate actionable suggestions (NO AUTO-MODIFICATION)
        
        Args:
            current_allocation: User's current portfolio allocation
            recommended_allocation: Target allocation based on risk profile
        
        Returns:
            Rebalancing suggestions with actions
        """
        suggestions = []
        summary = {
            'needs_rebalancing': False,
            'total_deviation': 0,
            'action_required': []
        }
        
        # Compare each category
        for category in ['equity', 'debt', 'cash']:
            current = current_allocation.get(category, 0)
            recommended = recommended_allocation.get(category, 0)
            
            difference = current - recommended
            abs_difference = abs(difference)
            
            # Track total deviation
            summary['total_deviation'] += abs_difference
            
            # Generate suggestion if deviation > 5%
            if abs_difference > 5:
                summary['needs_rebalancing'] = True
                
                if difference > 0:
                    # Overweight - reduce
                    suggestion = {
                        'category': category,
                        'status': 'overweight',
                        'current': current,
                        'recommended': recommended,
                        'difference': round(difference, 2),
                        'action': f"Reduce {category.title()} exposure by {abs_difference:.1f}%",
                        'priority': 'high' if abs_difference > 15 else 'medium'
                    }
                else:
                    # Underweight - increase
                    suggestion = {
                        'category': category,
                        'status': 'underweight',
                        'current': current,
                        'recommended': recommended,
                        'difference': round(difference, 2),
                        'action': f"Increase {category.title()} exposure by {abs_difference:.1f}%",
                        'priority': 'high' if abs_difference > 15 else 'medium'
                    }
                
                suggestions.append(suggestion)
                summary['action_required'].append(category)
        
        # Round total deviation
        summary['total_deviation'] = round(summary['total_deviation'], 2)
        
        # Generate overall recommendation
        if not summary['needs_rebalancing']:
            summary['message'] = "✅ Your portfolio is well-balanced and aligned with your risk profile."
        elif summary['total_deviation'] < 20:
            summary['message'] = "⚠️ Minor rebalancing recommended to optimize your portfolio."
        else:
            summary['message'] = "🔴 Significant rebalancing required. Consider adjusting your allocations."
        
        return {
            'suggestions': suggestions,
            'summary': summary,
            'generated_at': datetime.now().isoformat()
        }
    
    @staticmethod
    def generate_full_recommendation(
        risk_profile: str,
        holdings: List[Dict]
    ) -> Dict:
        """
        Complete recommendation flow
        Combines all steps into one comprehensive recommendation
        """
        # Step 1: Get recommended allocation
        recommended = RecommendationEngine.get_recommended_allocation(risk_profile)
        
        # Step 2: Calculate current allocation
        current = RecommendationEngine.calculate_current_allocation(holdings)
        
        # Step 3: Generate rebalancing suggestions
        rebalancing = RecommendationEngine.generate_rebalancing_suggestions(
            current,
            recommended
        )
        
        return {
            'risk_profile': risk_profile,
            'recommended_allocation': {
                'equity': recommended['equity'],
                'debt': recommended['debt'],
                'cash': recommended['cash'],
                'description': recommended['description']
            },
            'current_allocation': {
                'equity': current['equity'],
                'debt': current['debt'],
                'cash': current['cash'],
                'total_value': current['total_value']
            },
            'rebalancing': rebalancing,
            'generated_at': datetime.now().isoformat()
        }


# Example usage
if __name__ == "__main__":
    # Test data
    holdings = [
        {'symbol': 'TCS', 'asset_type': 'equity', 'current_value': 150000},
        {'symbol': 'RELIANCE', 'asset_type': 'equity', 'current_value': 100000},
        {'symbol': 'SBI_BOND', 'asset_type': 'debt', 'current_value': 30000},
        {'symbol': 'SAVINGS', 'asset_type': 'cash', 'current_value': 20000}
    ]
    
    result = RecommendationEngine.generate_full_recommendation('moderate', holdings)
    
    print("=" * 60)
    print("RECOMMENDATION REPORT")
    print("=" * 60)
    print(f"\nRisk Profile: {result['risk_profile'].title()}")
    print(f"\nRecommended Allocation:")
    print(f"  Equity: {result['recommended_allocation']['equity']}%")
    print(f"  Debt: {result['recommended_allocation']['debt']}%")
    print(f"  Cash: {result['recommended_allocation']['cash']}%")
    
    print(f"\nCurrent Allocation:")
    print(f"  Equity: {result['current_allocation']['equity']}%")
    print(f"  Debt: {result['current_allocation']['debt']}%")
    print(f"  Cash: {result['current_allocation']['cash']}%")
    print(f"  Total Value: ₹{result['current_allocation']['total_value']:,.2f}")
    
    print(f"\nRebalancing Summary:")
    print(f"  {result['rebalancing']['summary']['message']}")
    print(f"  Total Deviation: {result['rebalancing']['summary']['total_deviation']:.2f}%")
    
    if result['rebalancing']['suggestions']:
        print(f"\nSuggestions:")
        for sug in result['rebalancing']['suggestions']:
            print(f"  • {sug['action']} (Priority: {sug['priority']})")