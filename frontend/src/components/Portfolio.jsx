import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { toast } from "react-toastify";
import HoldingsTable from "./HoldingsTable";
import TransactionsTable from "./TransactionsTable";
import BuyModal from "./BuyModal";
import SellModal from "./SellModal";

function Portfolio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("holdings");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchSummary();
  }, [refreshKey]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get("/portfolio/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("❌ Fetch summary error:", err);
      toast.error("Failed to fetch portfolio summary");
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionComplete = () => {
    setShowBuyModal(false);
    setShowSellModal(false);
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/home")}
                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  My Portfolio
                </h1>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBuyModal(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Buy
              </button>
              <button
                onClick={() => setShowSellModal(true)}
                className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-lg shadow-red-500/30 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                Sell
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Invested</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{summary?.total_invested?.toLocaleString() || 0}</h3>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Current Value</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{summary?.current_value?.toLocaleString() || 0}</h3>
          </div>

          <div className={`bg-white rounded-xl p-6 shadow-sm border ${(summary?.profit_loss || 0) >= 0 ? 'border-green-100' : 'border-red-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${(summary?.profit_loss || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <svg className={`w-6 h-6 ${(summary?.profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Profit/Loss</p>
            <h3 className={`text-2xl font-bold ${(summary?.profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(summary?.profit_loss || 0) >= 0 ? '+' : ''}₹{summary?.profit_loss?.toLocaleString() || 0}
            </h3>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Assets</p>
            <h3 className="text-2xl font-bold text-gray-900">{summary?.total_assets || 0}</h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("holdings")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "holdings"
                    ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Holdings
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "transactions"
                    ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Transactions
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "holdings" ? (
              <HoldingsTable refresh={refreshKey} />
            ) : (
              <TransactionsTable refresh={refreshKey} />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showBuyModal && (
        <BuyModal
          onClose={() => setShowBuyModal(false)}
          onSuccess={handleTransactionComplete}
        />
      )}

      {showSellModal && (
        <SellModal
          onClose={() => setShowSellModal(false)}
          onSuccess={handleTransactionComplete}
        />
      )}
    </div>
  );
}

export default Portfolio;