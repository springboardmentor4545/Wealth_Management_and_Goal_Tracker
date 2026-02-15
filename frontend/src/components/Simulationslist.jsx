// frontend/src/components/SimulationsList.jsx (COMPLETE - WITH INLINE MODAL)

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const SimulationsList = ({ onSelectSimulation, refreshTrigger }) => {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    simulationId: null,
    simulationName: ''
  });

  useEffect(() => {
    fetchSimulations();
  }, [refreshTrigger]);

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/simulations/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch simulations');
      }

      const data = await response.json();
      setSimulations(data);
    } catch (error) {
      console.error('Fetch simulations error:', error);
      toast.error('Failed to load simulations');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id, scenarioName, e) => {
    e.stopPropagation(); // Prevent card click
    setDeleteModal({
      isOpen: true,
      simulationId: id,
      simulationName: scenarioName
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/simulations/${deleteModal.simulationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete simulation');
      }

      toast.success('Simulation deleted successfully');
      setDeleteModal({ isOpen: false, simulationId: null, simulationName: '' });
      fetchSimulations(); // Refresh list
    } catch (error) {
      console.error('Delete simulation error:', error);
      toast.error('Failed to delete simulation');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, simulationId: null, simulationName: '' });
  };

  const formatCurrency = (value) => {
    return `₹${parseFloat(value).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (simulations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Simulations Yet</h3>
        <p className="text-gray-600">Create your first simulation to see projections</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Desktop View - Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {simulations.map((simulation) => {
            const { results, assumptions } = simulation;
            const isTargetMet = assumptions.target_amount 
              ? results.final_value >= assumptions.target_amount 
              : null;

            return (
              <div
                key={simulation.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectSimulation && onSelectSimulation(simulation)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {simulation.scenario_name}
                      </h3>
                      {simulation.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {simulation.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeleteClick(simulation.id, simulation.scenario_name, e)}
                      className="text-gray-400 hover:text-red-600 transition-colors ml-2"
                      title="Delete simulation"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Final Value</span>
                      <span className="text-lg font-bold text-purple-600">
                        {formatCurrency(results.final_value)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Returns</span>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(results.total_returns)}
                      </span>
                    </div>

                    {assumptions.target_amount && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Target</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(assumptions.target_amount)}
                          </span>
                          {isTargetMet !== null && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              isTargetMet 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {isTargetMet ? '✓ Met' : '⚠ Shortfall'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assumptions Summary */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Time Horizon</span>
                        <p className="font-medium text-gray-900">{assumptions.time_horizon_years} years</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected Return</span>
                        <p className="font-medium text-gray-900">{assumptions.expected_return_percent}% p.a.</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Initial Amount</span>
                        <p className="font-medium text-gray-900">{formatCurrency(assumptions.initial_amount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Monthly SIP</span>
                        <p className="font-medium text-gray-900">{formatCurrency(assumptions.monthly_contribution)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t mt-4 pt-3 flex justify-between items-center text-xs text-gray-500">
                    <span>Created {formatDate(simulation.created_at)}</span>
                    <span className="text-purple-600 font-medium">View Details →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal (INLINE - NO SEPARATE FILE NEEDED) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleDeleteCancel}
          ></div>

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
              {/* Icon */}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Simulation
              </h3>

              {/* Message */}
              <p className="text-gray-600 text-center mb-2">
                Are you sure you want to delete
              </p>
              <p className="text-gray-900 font-semibold text-center mb-6">
                "{deleteModal.simulationName}"?
              </p>
              <p className="text-sm text-gray-500 text-center mb-6">
                This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimulationsList;