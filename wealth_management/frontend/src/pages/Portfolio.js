import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function Portfolio() {
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

  // ---------------- Fetch Data ----------------
  const fetchPortfolio = async () => {
    try {
      const [h, t] = await Promise.all([
        api.get("/portfolio/holdings"),
        api.get("/portfolio/transactions"),
      ]);
      setHoldings(h.data);
      setTransactions(t.data);
    } catch {
      toast.error("Failed to load portfolio");
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // ---------------- UPDATE PRICES ----------------
  const updatePrices = async () => {
    try {
      await api.get("/portfolio/market/live");
      toast.success("Market prices updated");
      fetchPortfolio();
    } catch {
      toast.error("Failed to update prices");
    }
  };

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
        executed_at: formData.executed_at
          ? new Date(formData.executed_at + "T12:00:00").toISOString()
          : null,
      };

      await api.post("/portfolio/transaction", payload);
      toast.success("Transaction added successfully");

      resetForm();
      fetchPortfolio();
    } catch {
      toast.error("Failed to add transaction");
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toFixed(2)}`;

  const inputClass =
    "w-full p-2 rounded border " +
    "bg-blue-50 dark:bg-gray-700 " +
    "border-blue-300 dark:border-gray-600 " +
    "text-gray-900 dark:text-white " +
    "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 " +
    "focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600";

  return (
    <div className="py-4 px-4">
      <div className="max-w-6xl mx-auto pt-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300">
            Portfolio
          </h2>

          {!showForm && (
            <div className="flex gap-4">
              <button
                onClick={updatePrices}
                className="px-6 py-2 rounded-lg shadow
                  bg-green-600 text-white hover:bg-green-500"
              >
                Update Prices
              </button>

              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2 rounded-lg shadow
                  bg-blue-700 text-white hover:bg-blue-600 dark:bg-blue-400"
              >
                + Add Transaction
              </button>
            </div>
          )}
        </div>

        {/* ---------------- Add Transaction Form ---------------- */}
        {showForm && (
          <div className="flex justify-center mb-10">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-2xl rounded-2xl shadow-xl p-8
                bg-white dark:bg-gray-800"
            >
              <h3 className="text-2xl font-semibold text-center mb-6
                text-blue-700 dark:text-blue-300">
                Add Transaction
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Symbol</label>
                  <input
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price per Unit
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fees</label>
                  <input
                    type="number"
                    name="fees"
                    value={formData.fees}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Transaction Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Asset Type
                  </label>
                  <select
                    name="asset_type"
                    value={formData.asset_type}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="stock">Stock</option>
                    <option value="etf">ETF</option>
                    <option value="mutual_fund">Mutual Fund</option>
                    <option value="bond">Bond</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    name="executed_at"
                    value={formData.executed_at}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-500">
                  Save
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 dark:bg-gray-600
                    text-gray-800 dark:text-white
                    py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- Holdings ---------------- */}
        {!showForm && holdings.length > 0 && (
          <div className="rounded-2xl shadow-lg p-6 mb-8 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-300">
              Holdings
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-center">
                <thead className="bg-blue-100 dark:bg-gray-700">
                  <tr>
                    {[
                      "Symbol",
                      "Asset",
                      "Units",
                      "Avg Buy",
                      "Cost",
                      "Current Value",
                      "Profit/Loss",
                      "Profit/Loss %",
                      "Updated",
                    ].map((h) => (
                      <th key={h} className="p-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {holdings.map((h) => {
                    const profit = Number(h.current_value) - Number(h.cost_basis);
                    const profitPercent =
                      h.cost_basis > 0
                        ? (profit / Number(h.cost_basis)) * 100
                        : 0;

                    return (
                      <tr key={h.id} className="border-t dark:border-gray-700">
                        <td className="p-2">{h.symbol}</td>
                        <td className="p-2 capitalize">{h.asset_type}</td>
                        <td className="p-2">{Number(h.units).toFixed(2)}</td>
                        <td className="p-2">{formatCurrency(h.avg_buy_price)}</td>
                        <td className="p-2">{formatCurrency(h.cost_basis)}</td>
                        <td className="p-2 font-medium">
                          {formatCurrency(h.current_value)}
                        </td>
                        <td
                          className={`p-2 font-semibold ${
                            profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(profit)}
                        </td>
                        <td
                          className={`p-2 ${
                            profit >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {profitPercent.toFixed(2)}%
                        </td>
                        <td className="p-2 text-sm">
                          {h.last_price_updated_at
                            ? new Date(h.last_price_updated_at).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- Transactions ---------------- */}
        {!showForm && transactions.length > 0 && (
          <div className="rounded-2xl shadow-lg p-6 bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-300">
              Transaction History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-center">
                <thead className="bg-blue-100 dark:bg-gray-700">
                  <tr>
                    {["Symbol", "Type", "Qty", "Price", "Fees", "Date"].map(
                      (h) => (
                        <th key={h} className="p-3 font-medium">{h}</th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-t dark:border-gray-700">
                      <td className="p-2">{t.symbol}</td>
                      <td className="p-2 capitalize">{t.type}</td>
                      <td className="p-2">{Number(t.quantity).toFixed(2)}</td>
                      <td className="p-2">{formatCurrency(t.price)}</td>
                      <td className="p-2">{formatCurrency(t.fees)}</td>
                      <td className="p-2">
                        {new Date(t.executed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
