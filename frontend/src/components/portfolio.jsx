import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getHoldings,
  buyAsset,
  sellAsset,
  getTransactions,
} from "../api/portfolio";
import { getCurrentUser } from "../api/auth";
import { toast } from "react-toastify";

export default function Portfolio() {
  const navigate = useNavigate();

  // 🔑 Logged-in user
  const [userId, setUserId] = useState(null);

  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [type, setType] = useState("buy");
  const [assetType, setAssetType] = useState("");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  // =============================
  // FETCH LOGGED IN USER
  // =============================
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          toast.error("Please login again");
          navigate("/login");
          return;
        }
        setUserId(user.id);
      } catch {
        toast.error("Authentication failed");
        navigate("/login");
      }
    })();
  }, [navigate]);

  // =============================
  // LOAD DATA AFTER USER ID
  // =============================
  useEffect(() => {
    if (!userId) return;
    loadHoldings();
    loadTransactions();
  }, [userId]);

  const loadHoldings = async () => {
    try {
      const data = await getHoldings(userId);
      setHoldings(data);
    } catch {
      toast.error("Failed to load holdings");
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await getTransactions(userId);
      setTransactions(data);
    } catch {
      toast.error("Failed to load transactions");
    }
  };

  // =============================
  // SUBMIT TRANSACTION
  // =============================
  const handleSubmit = async () => {
    if (!symbol || !quantity || !price || (type === "buy" && !assetType)) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      symbol: symbol.trim().toUpperCase(),
      quantity: Number(quantity),
      price: Number(price),
    };

    try {
      if (type === "buy") {
        await buyAsset({ ...payload, asset_type: assetType });
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
    } catch {
      toast.error("Transaction failed");
    }
  };

  const totalPortfolioValue = holdings.reduce(
    (sum, h) => sum + Number(h.cost_basis || 0),
    0
  );

  return (
    <div className="min-h-screen p-6 space-y-8 bg-gradient-to-br from-yellow-100 via-orange-200 to-yellow-50">

      {/* ================= TOP BAR ================= */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow"
        >
          ← Back
        </button>

        <h1 className="text-4xl font-extrabold text-yellow-900 text-center flex-1">
          Portfolio
        </h1>

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
              <option value="stock">Stock</option>
              <option value="etf">ETF</option>
              <option value="mutual_fund">Mutual Fund</option>
              <option value="bond">Bond</option>
              <option value="cash">Cash</option>
            </select>
          )}

          <input
            className="border rounded px-3 py-2"
            placeholder="Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />

          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Price"
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
      </div>

      {/* ================= TRANSACTION HISTORY ================= */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              {["Type", "Symbol", "Qty", "Price", "Fees", "Date"].map((h) => (
                <th key={h} className="border p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
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
                    {new Date(t.executed_at).toLocaleDateString()}
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
