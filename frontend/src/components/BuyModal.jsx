import { useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

function BuyModal({ onClose, onSuccess }) {
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalCost = (Number(quantity) * Number(price)) + Number(fees);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        symbol: symbol.toUpperCase().trim(),
        type: "buy",
        quantity: Number(quantity),
        price: Number(price),
        fees: Number(fees),
      };

      console.log("Buy payload:", payload);

      await api.post("/portfolio/buy", payload);
      toast.success("Asset purchased successfully!");
      onSuccess();
    } catch (err) {
      console.error("BUY ERROR:", err);
      const errorMsg = err.response?.data?.detail || "Failed to buy asset";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl p-6">
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
              📈
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Buy Asset</h3>
              <p className="text-green-100 text-sm mt-1">Purchase stocks or securities</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Symbol */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Symbol / Ticker
            </label>
            <input
              type="text"
              placeholder="e.g., RELIANCE, TCS"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all uppercase"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              placeholder="10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="0.0001"
              step="0.0001"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price per Unit (₹)
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
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
            </div>
          </div>

          {/* Total Cost Summary */}
          {quantity && price && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Total Cost
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Investment:</span>
                  <span className="font-semibold text-green-900">₹{(Number(quantity) * Number(price)).toLocaleString()}</span>
                </div>
                {Number(fees) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Fees:</span>
                    <span className="font-semibold text-green-900">₹{Number(fees).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-green-300">
                  <span className="text-green-700 font-bold">Total:</span>
                  <span className="font-bold text-green-900 text-lg">₹{totalCost.toLocaleString()}</span>
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
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Buy Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BuyModal;