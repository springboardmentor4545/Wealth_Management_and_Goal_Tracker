import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function Portfolio() {
  const navigate = useNavigate();

  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    symbol: "",
    type: "buy",
    asset_type: "stock",
    quantity: "",
    price: "",
    fees: "",
    executed_at: "",
  });

  // ---------------- Calculate Total Portfolio Value ----------------
  const totalValue = holdings.reduce(
    (sum, h) => sum + Number(h.current_value || 0),
    0
  );

  // ---------------- Fetch Data ----------------
  const fetchPortfolio = async () => {
    try {
      const [h, t] = await Promise.all([
        api.get("/portfolio/holdings"),
        api.get("/portfolio/transactions"),
      ]);
      setHoldings(h.data);
      setTransactions(t.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load portfolio");
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // ---------------- Form Handlers ----------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      symbol: "",
      type: "buy",
      asset_type: "stock",
      quantity: "",
      price: "",
      fees: "",
      executed_at: "",
    });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        symbol: formData.symbol.trim(),
        type: formData.type,
        asset_type: formData.asset_type,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        fees: Number(formData.fees || 0),
        executed_at: new Date(formData.executed_at).toISOString(),
      };

      await api.post("/portfolio/transaction", payload);
      toast.success("Transaction added successfully");

      resetForm();
      fetchPortfolio();
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Failed to add transaction");
    }
  };

  // ---------------- Helper ----------------
  const formatCurrency = (val) => `₹${Number(val || 0).toFixed(2)}`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-white font-medium hover:text-blue-50"
      >
        ← Back
      </button>

      {/* -------- Title + Add -------- */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Portfolio</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-white px-5 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            + Add Transaction
          </button>
        )}
      </div>

      {/* ---------------- Add Transaction Form ---------------- */}
      {showForm && (
        <div className="flex justify-center mb-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-4"
          >
            <h3 className="text-xl font-semibold text-center text-blue-700">
              Add Transaction
            </h3>

            {/* Symbol */}
            <div>
              <label className="block text-sm font-medium mb-1">Symbol</label>
              <input
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                required
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Transaction Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            {/* Asset Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Asset Type</label>
              <select
                name="asset_type"
                value={formData.asset_type}
                onChange={handleChange}
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
              >
                <option value="stock">Stock</option>
                <option value="etf">ETF</option>
                <option value="mutual_fund">Mutual Fund</option>
                <option value="bond">Bond</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1">Price per Unit</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            {/* Fees */}
            <div>
              <label className="block text-sm font-medium mb-1">Fees</label>
              <input
                type="number"
                name="fees"
                value={formData.fees}
                onChange={handleChange}
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            {/* Executed Date */}
            <div>
              <label className="block text-sm font-medium mb-1">Executed Date</label>
              <input
                type="date"
                name="executed_at"
                value={formData.executed_at}
                onChange={handleChange}
                required
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-3">
              <button className="flex-1 bg-green-600 text-white py-2 rounded">
                Save
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-300 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------- Total Portfolio Value ---------------- */}
      {!showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="text-3xl font-bold text-center">₹{totalValue.toFixed(2)}</div>
           <h3 className="text-xl font-semibold mb-2 text-black text-center">Your Total Portfolio Value</h3>
        </div>
      )}

      {/* ---------------- Holdings Table ---------------- */}
      {!showForm && holdings.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Holdings</h3>
          <table className="min-w-full">
            <thead>
              <tr>
                {["Symbol", "Asset", "Units", "Avg Buy Price", "Cost Basis", "Current Value"].map(
                  (h) => (
                    <th key={h} className="border border-blue-500 bg-blue-50 p-4">{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => (
                <tr key={h.id} className="text-center">
                  <td className="border border-blue-500 p-2">{h.symbol}</td>
                  <td className="border border-blue-500 p-2">{h.asset_type}</td>
                  <td className="border border-blue-500 p-2">{Number(h.units).toFixed(2)}</td>
                  <td className="border border-blue-500 p-2">{formatCurrency(h.avg_buy_price)}</td>
                  <td className="border border-blue-500 p-2">{formatCurrency(h.cost_basis)}</td>
                  <td className="border border-blue-500 p-2">{formatCurrency(h.current_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------- Transaction History ---------------- */}
      {!showForm && transactions.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Transaction History</h3>
          <table className="min-w-full">
            <thead>
              <tr>
                {["Symbol", "Type", "Qty", "Price", "Fees", "Date"].map((h) => (
                  <th key={h} className="border border-blue-500 bg-blue-50 p-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="text-center">
                  <td className="border border-blue-500 p-2">{t.symbol}</td>
                  <td className="border border-blue-500 p-2">{t.type}</td>
                  <td className="border border-blue-500 p-2">{Number(t.quantity).toFixed(2)}</td>
                  <td className="border border-blue-500 p-2">{formatCurrency(t.price)}</td>
                  <td className="border border-blue-500 p-2">{formatCurrency(t.fees)}</td>
                  <td className="border border-blue-500 p-2">{new Date(t.executed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
