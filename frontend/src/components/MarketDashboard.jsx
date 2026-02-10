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
    <div className="min-h-screen bg-gradient-to-br from-[#fff4e6] to-[#ffd8a8] p-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/home")}
          className="text-orange-700 font-semibold hover:underline"
        >
          ← Back to Home
        </button>

        <h1 className="text-3xl font-bold text-orange-800">
          Market Data Table
        </h1>

        <button
          onClick={fetchMarketData}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-orange-100 text-orange-800">
            <tr>
              <th className="p-4">Symbol</th>
              <th className="p-4">Last Price ($)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(prices).length === 0 ? (
              <tr>
                <td colSpan="2" className="p-6 text-center text-gray-500">
                  No market data available
                </td>
              </tr>
            ) : (
              Object.entries(prices).map(([symbol, price]) => (
                <tr key={symbol} className="border-t">
                  <td className="p-4 font-semibold">{symbol}</td>
                  <td className="p-4">${Number(price).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Market;
