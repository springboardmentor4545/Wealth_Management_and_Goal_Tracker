import { useEffect, useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

function TransactionsTable({ refresh }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [refresh]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/portfolio/transactions");
      console.log("✅ Transactions fetched:", res.data);
      setTransactions(res.data || []);
    } catch (err) {
      console.error("❌ Fetch transactions error:", err);
      toast.error("Failed to fetch transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading transactions...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
        <p className="text-gray-600">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile View - Cards */}
      <div className="block md:hidden space-y-4">
        {transactions.map((txn) => (
          <div key={txn.id} className={`rounded-xl p-5 border-2 shadow-sm ${
            txn.type === 'buy' 
              ? 'bg-gradient-to-br from-white to-green-50 border-green-100' 
              : 'bg-gradient-to-br from-white to-red-50 border-red-100'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-lg text-gray-900 uppercase">{txn.symbol}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    txn.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {txn.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{formatDate(txn.executed_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-gray-900">₹{txn.total_value.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Quantity:</span>
                <p className="font-semibold text-gray-900">{txn.quantity}</p>
              </div>
              <div>
                <span className="text-gray-600">Price:</span>
                <p className="font-semibold text-gray-900">₹{txn.price.toLocaleString()}</p>
              </div>
              {txn.fees > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-600">Fees:</span>
                  <p className="font-semibold text-gray-900">₹{txn.fees.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date & Time</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Symbol</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Type</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Quantity</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Price</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Fees</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Total Value</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{formatDate(txn.executed_at)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      txn.type === 'buy' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-br from-red-500 to-rose-500'
                    }`}>
                      <span className="text-white font-bold text-sm">{txn.symbol[0]}</span>
                    </div>
                    <span className="font-bold text-gray-900 uppercase">{txn.symbol}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    txn.type === 'buy' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {txn.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-700">{txn.quantity}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-700">₹{txn.price.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-700">₹{txn.fees.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-gray-900">₹{txn.total_value.toLocaleString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionsTable;