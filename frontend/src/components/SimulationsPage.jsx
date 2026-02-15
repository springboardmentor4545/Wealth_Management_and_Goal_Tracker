// frontend/src/components/SimulationsPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SimulationForm from './SimulationForm';
import SimulationResults from './SimulationResults';
import SimulationsList from './SimulationsList';

const SimulationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSimulationCreated = (simulation) => {
    setSelectedSimulation(simulation);
    setActiveTab('results');
    setRefreshKey(prev => prev + 1); // Trigger list refresh
  };

  const handleSelectSimulation = (simulation) => {
    setSelectedSimulation(simulation);
    setActiveTab('results');
  };

  const handleBack = () => {
    setSelectedSimulation(null);
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/home')}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Financial Simulations
                </h1>
              </div>
            </div>

            {activeTab !== 'results' && (
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    activeTab === 'list'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  My Simulations
                </button>
                <button
                  onClick={() => {
                    setSelectedSimulation(null);
                    setActiveTab('create');
                  }}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'create'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Simulation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        {activeTab === 'list' && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 text-lg mb-1">
                  What-If Analysis
                </h3>
                <p className="text-blue-800 text-sm">
                  Create financial simulations to explore different investment scenarios. Adjust assumptions like returns, time horizon, and contributions to see how your wealth could grow. All simulations are safe - they don't affect your actual portfolio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {activeTab === 'list' && (
          <SimulationsList 
            onSelectSimulation={handleSelectSimulation}
            refreshTrigger={refreshKey}
          />
        )}

        {activeTab === 'create' && (
          <SimulationForm 
            onSimulationCreated={handleSimulationCreated}
          />
        )}

        {activeTab === 'results' && selectedSimulation && (
          <div>
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="mb-6 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Simulations
            </button>

            {/* Simulation Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedSimulation.scenario_name}
                  </h2>
                  {selectedSimulation.description && (
                    <p className="text-gray-600">{selectedSimulation.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedSimulation.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Results */}
            <SimulationResults simulation={selectedSimulation} />
          </div>
        )}
      </main>
    </div>
  );
};

export default SimulationsPage;