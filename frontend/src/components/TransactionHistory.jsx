// src/components/TransactionHistory.jsx
import { useEffect, useState } from "react";
import { getTransactions } from "../api/portfolio";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const userId = 1; // demo user

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions(userId);
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions", error);
    }
  };

  return (
    <div className="p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>

      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Symbol</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Fees</th>
          </tr>
        </thead>

        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center p-4">
                No transactions found
              </td>
            </tr>
          ) : (
            transactions.map((tx, index) => (
              <tr key={index}>
                <td className="border p-2">
                  {new Date(tx.executed_at).toLocaleString()}
                </td>
                <td className="border p-2">{tx.symbol}</td>
                <td className="border p-2 capitalize">{tx.type}</td>
                <td className="border p-2">{tx.quantity}</td>
                <td className="border p-2">{tx.price}</td>
                <td className="border p-2">{tx.fees}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;
