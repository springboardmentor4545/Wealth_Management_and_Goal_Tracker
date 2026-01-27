import { useEffect, useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

function HoldingsTable({ refresh }) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

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
        {holdings.map((holding, index) => (
          <div key={index} className="bg-gradient-to-br from-white to-green-50 rounded-xl p-5 border-2 border-green-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-lg text-gray-900 uppercase">{holding.symbol}</h4>
                <p className="text-sm text-gray-600">Units: {holding.units_held}</p>
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
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Symbol</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Units</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Avg Buy Price</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Cost Basis</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Current Value</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">P&L</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">P&L %</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {holdings.map((holding, index) => (
              <tr key={index} className="hover:bg-green-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{holding.symbol[0]}</span>
                    </div>
                    <span className="font-bold text-gray-900 uppercase">{holding.symbol}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-700">{holding.units_held}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-700">₹{holding.avg_buy_price.toLocaleString()}</span>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HoldingsTable;