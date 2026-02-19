// frontend/src/components/ReportsPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState({});

  const handleExport = async (type) => {
    try {
      setDownloading({ ...downloading, [type]: true });
      const token = localStorage.getItem('access_token');
      
      let endpoint = '';
      let filename = '';
      
      switch(type) {
        case 'holdings':
          endpoint = 'http://localhost:8000/reports/export/holdings';
          filename = `portfolio_holdings_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'transactions':
          endpoint = 'http://localhost:8000/reports/export/transactions';
          filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'simulations':
          endpoint = 'http://localhost:8000/reports/export/simulations';
          filename = `simulations_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${type}`);
    } finally {
      setDownloading({ ...downloading, [type]: false });
    }
  };

  const exportOptions = [
    {
      id: 'holdings',
      title: 'Portfolio Holdings',
      description: 'Export your current holdings with prices and P&L',
      icon: '📊',
      color: 'purple'
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      description: 'Complete history of all buy/sell transactions',
      icon: '💰',
      color: 'blue'
    },
    {
      id: 'simulations',
      title: 'Simulations',
      description: 'Export all your what-if analysis scenarios',
      icon: '🔮',
      color: 'pink'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')} className="p-2 hover:bg-purple-50 rounded-lg">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Reports & Export
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 text-lg mb-1">
                Export Your Data
              </h3>
              <p className="text-blue-800 text-sm">
                Download your portfolio data in CSV format for analysis in Excel or Google Sheets. All exports include the most recent data from your account.
              </p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exportOptions.map((option) => (
            <div key={option.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className={`w-16 h-16 bg-${option.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                <span className="text-3xl">{option.icon}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {option.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-6">
                {option.description}
              </p>
              
              <button
                onClick={() => handleExport(option.id)}
                disabled={downloading[option.id]}
                className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all ${
                  downloading[option.id]
                    ? 'bg-gray-400 cursor-not-allowed'
                    : `bg-gradient-to-r from-${option.color}-600 to-${option.color}-700 hover:from-${option.color}-700 hover:to-${option.color}-800 shadow-lg`
                }`}
              >
                {downloading[option.id] ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Downloading...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">About Exports</h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>All exports are in standard CSV format, compatible with Excel, Google Sheets, and most data analysis tools</p>
            </div>
            
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Portfolio holdings include current market prices, cost basis, and profit/loss calculations</p>
            </div>
            
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Transaction history includes all buy and sell orders with dates, prices, and fees</p>
            </div>
            
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Simulations export includes all your what-if scenarios with assumptions and projected results</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Coming Soon</h3>
          </div>
          
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-purple-600">•</span>
              PDF reports with charts and visualizations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">•</span>
              Scheduled email reports (daily, weekly, monthly)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">•</span>
              Tax summary reports for filing
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-600">•</span>
              Custom report builder
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;