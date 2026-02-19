// frontend/src/components/RecommendationsPage.jsx (FIXED)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// CRITICAL: Register Chart.js components BEFORE using them
ChartJS.register(ArcElement, Tooltip, Legend);

const RecommendationsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/recommendations/rebalance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      setRecommendation(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getPieChartData = (allocation) => ({
    labels: ['Equity', 'Debt', 'Cash'],
    datasets: [{
      data: [allocation.equity, allocation.debt, allocation.cash],
      backgroundColor: ['#8b5cf6', '#ec4899', '#10b981'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}%`
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No recommendations available</p>
          <button 
            onClick={() => navigate('/home')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { recommended_allocation, current_allocation, rebalancing } = recommendation;
  const needsRebalancing = rebalancing.summary.needs_rebalancing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')} className="p-2 hover:bg-purple-50 rounded-lg transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Portfolio Recommendations
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className={`mb-6 rounded-xl p-6 border-l-4 ${
          needsRebalancing 
            ? 'bg-amber-50 border-amber-400' 
            : 'bg-green-50 border-green-400'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              needsRebalancing ? 'bg-amber-100' : 'bg-green-100'
            }`}>
              {needsRebalancing ? (
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-lg mb-1 ${
                needsRebalancing ? 'text-amber-900' : 'text-green-900'
              }`}>
                {needsRebalancing ? 'Rebalancing Recommended' : 'Portfolio Balanced'}
              </h3>
              <p className={needsRebalancing ? 'text-amber-800' : 'text-green-800'}>
                {rebalancing.summary.message}
              </p>
              <p className={`text-sm mt-2 ${needsRebalancing ? 'text-amber-700' : 'text-green-700'}`}>
                Total Deviation: {rebalancing.summary.total_deviation}%
              </p>
            </div>
          </div>
        </div>

        {/* Risk Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Risk Profile</h2>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold capitalize">
              {recommendation.risk_profile}
            </div>
            <p className="text-gray-600">{recommended_allocation.description}</p>
          </div>
        </div>

        {/* Allocation Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Recommended Allocation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Allocation</h3>
            <div style={{ height: '300px', position: 'relative' }}>
              <Pie data={getPieChartData(recommended_allocation)} options={chartOptions} />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Equity:</span>
                <span className="font-semibold text-purple-600">{recommended_allocation.equity}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Debt:</span>
                <span className="font-semibold text-pink-600">{recommended_allocation.debt}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash:</span>
                <span className="font-semibold text-green-600">{recommended_allocation.cash}%</span>
              </div>
            </div>
          </div>

          {/* Current Allocation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Current Allocation</h3>
            <div style={{ height: '300px', position: 'relative' }}>
              <Pie data={getPieChartData(current_allocation)} options={chartOptions} />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Equity:</span>
                <span className="font-semibold text-purple-600">{current_allocation.equity}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Debt:</span>
                <span className="font-semibold text-pink-600">{current_allocation.debt}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash:</span>
                <span className="font-semibold text-green-600">{current_allocation.cash}%</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-bold text-gray-900">
                    ₹{current_allocation.total_value.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rebalancing Suggestions */}
        {rebalancing.suggestions && rebalancing.suggestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rebalancing Suggestions</h3>
            <div className="space-y-4">
              {rebalancing.suggestions.map((suggestion, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  suggestion.status === 'overweight' 
                    ? 'bg-red-50 border-red-400' 
                    : 'bg-blue-50 border-blue-400'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize mb-1">
                        {suggestion.category}
                      </h4>
                      <p className="text-sm text-gray-600">{suggestion.action}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      suggestion.priority === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {suggestion.priority} priority
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Current:</span>
                      <span className="ml-2 font-semibold">{suggestion.current}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Recommended:</span>
                      <span className="ml-2 font-semibold">{suggestion.recommended}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RecommendationsPage;