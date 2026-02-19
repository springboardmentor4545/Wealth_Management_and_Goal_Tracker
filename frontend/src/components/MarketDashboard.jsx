import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Market() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/market/latest");
      const data = await res.json();
      setPrices(data);
    } catch (err) {
      console.error("Failed to fetch market data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br from-white via-pink-300 to-red-700
        dark:bg-gray-900
        transition-colors duration-300
      "
    >
      {/* 🔶 Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/home")}
            className="text-orange-700 dark:text-gray-200 font-semibold hover:underline"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold text-orange-800 dark:text-gray-100">
            Market Overview
          </h1>

          <button
            onClick={fetchMarketData}
            className="
              bg-orange-600 hover:bg-orange-700
              dark:bg-indigo-600 dark:hover:bg-indigo-700
              text-white px-5 py-2 rounded-full transition
            "
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      {/* 🔶 Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Live Market Prices
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Latest snapshot of selected global stocks fetched from Yahoo Finance.
          </p>
        </div>

        {/* Market Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-orange-100 dark:bg-gray-700 text-orange-800 dark:text-gray-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Symbol
                </th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wide">
                  Last Price ($)
                </th>
              </tr>
            </thead>

            <tbody>
              {Object.keys(prices).length === 0 ? (
                <tr>
                  <td
                    colSpan="2"
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No market data available
                  </td>
                </tr>
              ) : (
                Object.entries(prices).map(([symbol, price], index) => (
                  <tr
                    key={symbol}
                    className={`
                      border-t dark:border-gray-700 transition
                      ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-800"
                          : "bg-orange-50/40 dark:bg-gray-700/40"
                      }
                      hover:bg-orange-50 dark:hover:bg-gray-700
                    `}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                      {symbol}
                    </td>
                    <td className="px-6 py-4 text-gray-800 dark:text-gray-300">
                      ${Number(price).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer hint */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Prices update during US market hours (7:00 PM – 1:30 AM IST).
        </div>
      </main>
    </div>
  );
}

export default Market;
