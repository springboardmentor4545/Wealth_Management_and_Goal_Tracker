import { useState } from 'react';
import { toast } from 'react-toastify';

const SimulationForm = ({ onSimulationCreated, initialGoalId = null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scenario_name: '',
    description: '',
    goal_id: initialGoalId,
    assumptions: {
      initial_amount: 50000,
      monthly_contribution: 5000,
      time_horizon_years: 10,
      expected_return_percent: 12,
      inflation_rate_percent: 6,
      target_amount: '',
      contribution_increase_percent: 0
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssumptionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      assumptions: {
        ...prev.assumptions,
        [name]: value === '' ? null : parseFloat(value)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/simulations/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          assumptions: {
            ...formData.assumptions,
            target_amount: formData.assumptions.target_amount || null
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create simulation');
      }

      const simulation = await response.json();
      toast.success('Simulation created successfully!');
      
      if (onSimulationCreated) {
        onSimulationCreated(simulation);
      }

    } catch (error) {
      console.error('Create simulation error:', error);
      toast.error(error.message || 'Failed to create simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Simulation</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scenario Name *
            </label>
            <input
              type="text"
              name="scenario_name"
              value={formData.scenario_name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Retirement by 50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Optional description"
            />
          </div>
        </div>

        {/* Assumptions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Assumptions</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Initial Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Amount (₹) *
              </label>
              <input
                type="number"
                name="initial_amount"
                value={formData.assumptions.initial_amount}
                onChange={handleAssumptionChange}
                required
                min="0"
                step="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Monthly Contribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Contribution (₹) *
              </label>
              <input
                type="number"
                name="monthly_contribution"
                value={formData.assumptions.monthly_contribution}
                onChange={handleAssumptionChange}
                required
                min="0"
                step="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Time Horizon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Horizon (Years) *
              </label>
              <input
                type="number"
                name="time_horizon_years"
                value={formData.assumptions.time_horizon_years}
                onChange={handleAssumptionChange}
                required
                min="1"
                max="50"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Expected Return */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Return (% p.a.) *
              </label>
              <input
                type="number"
                name="expected_return_percent"
                value={formData.assumptions.expected_return_percent}
                onChange={handleAssumptionChange}
                required
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Typical: 10-15% for equity, 6-8% for debt
              </p>
            </div>

            {/* Inflation Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inflation Rate (% p.a.) *
              </label>
              <input
                type="number"
                name="inflation_rate_percent"
                value={formData.assumptions.inflation_rate_percent}
                onChange={handleAssumptionChange}
                required
                min="0"
                max="20"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Historical average: 5-7% in India
              </p>
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Amount (₹)
              </label>
              <input
                type="number"
                name="target_amount"
                value={formData.assumptions.target_amount}
                onChange={handleAssumptionChange}
                min="0"
                step="10000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Optional"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if no specific target
              </p>
            </div>

            {/* Contribution Increase */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Contribution Increase (%)
              </label>
              <input
                type="number"
                name="contribution_increase_percent"
                value={formData.assumptions.contribution_increase_percent}
                onChange={handleAssumptionChange}
                min="0"
                max="20"
                step="0.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Increase monthly investment each year
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Running Simulation...
              </span>
            ) : (
              'Run Simulation'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimulationForm;