import { useState, useEffect } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

function SellModal({ onClose, onSuccess }) {
  const [holdings, setHoldings] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingHoldings, setLoadingHoldings] = useState(true);

  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    try {
      const res = await api.get("/portfolio/holdings");
      setHoldings(res.data || []);
    } catch (err) {
      console.error("Failed to fetch holdings:", err);
      toast.error("Failed to load your holdings");
    } finally {
      setLoadingHoldings(false);
    }
  };

  const selectedHolding = holdings.find(h => h.symbol === symbol);
  const totalReceived = (Number(quantity) * Number(price)) - Number(fees);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        symbol: symbol.toUpperCase().trim(),
        type: "sell",
        quantity: Number(quantity),
        price: Number(price),
        fees: Number(fees),
      };

      console.log("Sell payload:", payload);

      await api.post("/portfolio/sell", payload);
      toast.success("Asset sold successfully!");
      onSuccess();
    } catch (err) {
      console.error("SELL ERROR:", err);
      const errorMsg = err.response?.data?.detail || "Failed to sell asset";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600 to-rose-600 rounded-t-2xl p-6">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3 right-3 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
              📉
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Sell Asset</h3>
              <p className="text-red-100 text-sm mt-1">Sell your holdings</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Symbol Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Asset
            </label>
            {loadingHoldings ? (
              <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                Loading holdings...
              </div>
            ) : holdings.length === 0 ? (
              <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                No holdings available to sell
              </div>
            ) : (
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
              >
                <option value="">Choose an asset</option>
                {holdings.map((holding) => (
                  <option key={holding.symbol} value={holding.symbol}>
                    {holding.symbol} - {holding.units_held} units
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Show available units */}
          {selectedHolding && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Available:</span> {selectedHolding.units_held} units at avg ₹{selectedHolding.avg_buy_price.toLocaleString()} per unit
              </p>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              placeholder={selectedHolding ? `Max: ${selectedHolding.units_held}` : "0"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="0.0001"
              max={selectedHolding?.units_held || undefined}
              step="0.0001"
              disabled={!selectedHolding}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all disabled:bg-gray-100"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Selling Price per Unit (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500 font-medium">₹</span>
              <input
                type="number"
                placeholder="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0.01"
                step="0.01"
                disabled={!selectedHolding}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Fees */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fees / Charges (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500 font-medium">₹</span>
              <input
                type="number"
                placeholder="0"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                min="0"
                step="0.01"
                disabled={!selectedHolding}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Total Received Summary */}
          {quantity && price && selectedHolding && (
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border-2 border-red-200">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Total Received
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-700">Sale Value:</span>
                  <span className="font-semibold text-red-900">₹{(Number(quantity) * Number(price)).toLocaleString()}</span>
                </div>
                {Number(fees) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-red-700">Fees:</span>
                    <span className="font-semibold text-red-900">-₹{Number(fees).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-red-300">
                  <span className="text-red-700 font-bold">Net Amount:</span>
                  <span className="font-bold text-red-900 text-lg">₹{totalReceived.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || holdings.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  Sell Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SellModal;