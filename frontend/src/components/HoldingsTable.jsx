import { useEffect, useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

function HoldingsTable({ refresh }) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchHoldings();
  }, [refresh]);

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/portfolio/holdings");
      console.log("✅ Holdings fetched:", res.data);
      setHoldings(res.data || []);
    } catch (err) {
      console.error("❌ Fetch holdings error:", err);
      toast.error("Failed to fetch holdings");
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedHoldings = [...holdings].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const isPriceStale = (lastUpdated) => {
    if (!lastUpdated) return true;
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffHours = (now - updated) / (1000 * 60 * 60);
    return diffHours > 24;
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading holdings...</p>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Holdings Yet</h3>
        <p className="text-gray-600">Start investing by buying your first asset</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile View - Cards */}
      <div className="block md:hidden space-y-4">
        {sortedHoldings.map((holding, index) => {
          const isStale = isPriceStale(holding.last_price_updated_at);
          
          return (
            <div 
              key={index} 
              className={`rounded-xl p-5 border-2 shadow-sm ${
                isStale 
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' 
                  : 'bg-gradient-to-br from-white to-green-50 border-green-100'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg text-gray-900 uppercase">{holding.symbol}</h4>
                    {isStale && (
                      <span className="text-amber-600 text-xs" title="Price data may be outdated">⚠️</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Units: {holding.units_held}</p>
                  {holding.last_price_updated_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated: {formatLastUpdate(holding.last_price_updated_at)}
                    </p>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  holding.profit_loss >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {holding.profit_loss >= 0 ? '+' : ''}₹{holding.profit_loss.toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Buy Price:</span>
                  <span className="font-semibold text-gray-900">₹{holding.avg_buy_price.toLocaleString()}</span>
                </div>
                {holding.last_price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Price:</span>
                    <span className="font-semibold text-blue-600">₹{holding.last_price.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cost Basis:</span>
                  <span className="font-semibold text-gray-900">₹{holding.cost_basis.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Value:</span>
                  <span className="font-semibold text-gray-900">₹{holding.current_value.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('symbol')}
                  className="flex items-center gap-2 hover:text-green-600 transition-colors"
                >
                  Symbol {getSortIcon('symbol')}
                </button>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('units_held')}
                  className="flex items-center gap-2 ml-auto hover:text-green-600 transition-colors"
                >
                  Units {getSortIcon('units_held')}
                </button>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('avg_buy_price')}
                  className="flex items-center gap-2 ml-auto hover:text-green-600 transition-colors"
                >
                  Avg Buy Price {getSortIcon('avg_buy_price')}
                </button>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('last_price')}
                  className="flex items-center gap-2 ml-auto hover:text-green-600 transition-colors"
                >
                  Current Price {getSortIcon('last_price')}
                </button>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('cost_basis')}
                  className="flex items-center gap-2 ml-auto hover:text-green-600 transition-colors"
                >
                  Cost Basis {getSortIcon('cost_basis')}
                </button>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('current_value')}
                  className="flex items-center gap-2 ml-auto hover:text-green-600 transition-colors"
                >
                  Market Value {getSortIcon('current_value')}
                </button>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('profit_loss')}
                  className="flex items-center gap-2 ml-auto hover:text-green-600 transition-colors"
                >
                  P&L {getSortIcon('profit_loss')}
                </button>
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                <button 
                  onClick={() => handleSort('profit_loss_percentage')}
                  className="flex items-center gap-2 ml-auto hover:text-green-600 transition-colors"
                >
                  P&L % {getSortIcon('profit_loss_percentage')}
                </button>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedHoldings.map((holding, index) => {
              const isStale = isPriceStale(holding.last_price_updated_at);
              
              return (
                <tr 
                  key={index} 
                  className={`transition-colors ${
                    isStale 
                      ? 'bg-amber-50 hover:bg-amber-100' 
                      : 'hover:bg-green-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{holding.symbol[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 uppercase">{holding.symbol}</span>
                        {isStale && (
                          <span className="text-amber-600" title="Price data may be outdated">⚠️</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-700">{holding.units_held}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-gray-700">₹{holding.avg_buy_price.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {holding.last_price ? (
                      <span className="font-semibold text-blue-600">₹{holding.last_price.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-400 italic text-sm">Not available</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-900">₹{holding.cost_basis.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-900">₹{holding.current_value.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${holding.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.profit_loss >= 0 ? '+' : ''}₹{holding.profit_loss.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${holding.profit_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.profit_loss_percentage >= 0 ? '+' : ''}{holding.profit_loss_percentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {holding.last_price_updated_at ? (
                      <span className="text-xs text-gray-600">
                        {formatLastUpdate(holding.last_price_updated_at)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Never</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HoldingsTable;