import { useEffect, useState } from "react";
import api from "../api/axios";

export default function MarketData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLiveData = async () => {
    try {
      setLoading(true);
      setError("");

      // ✅ CORRECT API PATH
      const res = await api.get("/portfolio/market/live");

      setData(res.data || []);
    } catch (err) {
      console.error("Market data error:", err);
      setError("Failed to load market data");
      setData([]);
    } finally {
      // ✅ VERY IMPORTANT
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">
          Live Market Data
        </h2>

        {loading && (
          <p className="text-center text-gray-500">
            Loading market data...
          </p>
        )}

        {!loading && error && (
          <p className="text-center text-red-500">
            {error}
          </p>
        )}

        {!loading && !error && (
          <table className="w-full text-center">
            <thead className="bg-blue-100 dark:bg-gray-700">
              <tr>
                <th className="p-3">Symbol</th>
                <th className="p-3">Units</th>
                <th className="p-3">Live Price</th>
                <th className="p-3">Live Value</th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-gray-500">
                    No market data available
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={index} className="border-t dark:border-gray-700">
                    <td className="p-2">{item.symbol}</td>
                    <td className="p-2">{Number(item.units).toFixed(2)}</td>
                    <td className="p-2">
                      {item.live_price !== null
                        ? `₹${Number(item.live_price).toFixed(2)}`
                        : "Unavailable"}
                    </td>
                    <td className="p-2">
                      {item.live_value !== null
                        ? `₹${Number(item.live_value).toFixed(2)}`
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
