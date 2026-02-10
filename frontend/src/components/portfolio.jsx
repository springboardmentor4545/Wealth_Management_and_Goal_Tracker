import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getHoldings,
  buyAsset,
  sellAsset,
  getTransactions,
} from "../api/portfolio";
import { toast } from "react-toastify";

export default function Portfolio() {
  const navigate = useNavigate();
  const userId = 1; // demo user (as per backend)

  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // transaction form
  const [type, setType] = useState("buy");
  const [assetType, setAssetType] = useState("");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  // ================= LOAD DATA =================
  useEffect(() => {
    loadHoldings();
    loadTransactions();
  }, []);

  const loadHoldings = async () => {
    try {
      const data = await getHoldings(userId);
      setHoldings(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load holdings");
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await getTransactions(userId);
      setTransactions(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load transactions");
    }
  };

  // ================= BUY / SELL =================
  const handleSubmit = async () => {
    if (!symbol || !quantity || !price || (type === "buy" && !assetType)) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      user_id: userId,
      symbol: symbol.trim().toUpperCase(), // ✅ important
      quantity: Number(quantity),
      price: Number(price),
    };

    try {
      if (type === "buy") {
        await buyAsset({
          ...payload,
          asset_type: assetType, // ✅ must match enum values
        });
        toast.success("Buy transaction added");
      } else {
        await sellAsset(payload);
        toast.success("Sell transaction added");
      }

      setAssetType("");
      setSymbol("");
      setQuantity("");
      setPrice("");

      loadHoldings();
      loadTransactions();
    } catch (err) {
      console.error(err);
      toast.error("Transaction failed");
    }
  };

  // ================= CALCULATIONS =================
  const totalPortfolioValue = holdings.reduce(
    (sum, h) => sum + Number(h.cost_basis || 0),
    0
  );

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-yellow-100 via-orange-200 to-yellow-50 min-h-screen">
      {/* Top bar with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 hover:bg-white shadow"
          title="Back to Home"
        >
          <span className="text-xl">←</span>
          <span className="font-semibold text-yellow-900">Back</span>
        </button>

        <h1 className="text-4xl font-extrabold text-center text-yellow-900 flex-1">
          Portfolio
        </h1>

        {/* spacer so title stays centered */}
        <div className="w-[110px]" />
      </div>

      {/* ================= ADD TRANSACTION ================= */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="border rounded px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>

          {type === "buy" && (
            <select
              className="border rounded px-3 py-2"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
            >
              <option value="">Select Asset Type</option>
              {/* ✅ values match asset_type_enum exactly */}
              <option value="stock">Stock</option>
              <option value="etf">ETF</option>
              <option value="mutual_fund">Mutual Fund</option>
              <option value="bond">Bond</option>
              <option value="cash">Cash</option>
            </select>
          )}

          <input
            type="text"
            placeholder="Symbol (AAPL, NIFTYBEES)"
            className="border rounded px-3 py-2"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />

          <input
            type="number"
            placeholder="Quantity"
            className="border rounded px-3 py-2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <input
            type="number"
            placeholder="Price"
            className="border rounded px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full"
        >
          Submit
        </button>
      </div>

      {/* ================= HOLDINGS ================= */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Holdings</h2>

        <p className="mb-4 font-semibold">
          Total Portfolio Value: ₹{totalPortfolioValue.toFixed(2)}
        </p>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Asset Type</th>
              <th className="border p-2">Symbol</th>
              <th className="border p-2">Units</th>
              <th className="border p-2">Avg Buy Price</th>
              <th className="border p-2">Cost Basis</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No holdings found
                </td>
              </tr>
            ) : (
              holdings.map((h, i) => (
                <tr key={i}>
                  <td className="border p-2">{h.asset_type}</td>
                  <td className="border p-2">{h.symbol}</td>
                  <td className="border p-2">{h.units}</td>
                  <td className="border p-2">{h.avg_buy_price}</td>
                  <td className="border p-2">{h.cost_basis}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= TRANSACTIONS ================= */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Type</th>
              <th className="border p-2">Symbol</th>
              <th className="border p-2">Qty</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Fees</th>
              <th className="border p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  No transactions yet
                </td>
              </tr>
            ) : (
              transactions.map((t, i) => (
                <tr key={i}>
                  <td className="border p-2 capitalize">{t.type}</td>
                  <td className="border p-2">{t.symbol}</td>
                  <td className="border p-2">{t.quantity}</td>
                  <td className="border p-2">{t.price}</td>
                  <td className="border p-2">{t.fees}</td>
                  <td className="border p-2">
                    {t.executed_at
                      ? new Date(t.executed_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
