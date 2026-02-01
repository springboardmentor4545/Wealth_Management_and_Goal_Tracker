import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";

export default function Portfolio() {
    const [investments, setInvestments] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTx, setNewTx] = useState({
        symbol: "",
        type: "buy",
        quantity: "",
        price: "",
        fees: "0",
        asset_type: "stock"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const headers = { Authorization: `Bearer ${token}` };

            const [invRes, txRes] = await Promise.all([
                axios.get("http://127.0.0.1:8000/api/v1/portfolio/investments", { headers }),
                axios.get("http://127.0.0.1:8000/api/v1/portfolio/transactions", { headers })
            ]);

            setInvestments(invRes.data);
            setTransactions(txRes.data);
        } catch (err) {
            toast.error("Failed to load portfolio data");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("access_token");
            const quantity = parseFloat(newTx.quantity);
            const price = parseFloat(newTx.price);
            const fees = parseFloat(newTx.fees);

            if (quantity <= 0 || price <= 0) {
                toast.error("Quantity and Price must be positive");
                return;
            }

            const payload = {
                ...newTx,
                quantity,
                price,
                fees
            };

            await axios.post("http://127.0.0.1:8000/api/v1/portfolio/transactions", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Transaction recorded!");
            setShowAddModal(false);
            fetchData();
            setNewTx({
                symbol: "",
                type: "buy",
                quantity: "",
                price: "",
                fees: "0",
                asset_type: "stock"
            });
        } catch (err) {
            const msg = err.response?.data?.detail || "Failed to record transaction";
            toast.error(msg);
        }
    };

    const totalPortfolioValue = investments.reduce((acc, inv) => acc + (inv.current_value || 0), 0);

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 relative font-sans text-white">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>

            <div className="relative max-w-6xl mx-auto space-y-8">
                <Navbar />

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">Your Portfolio</h1>
                        <p className="text-slate-400">Manage your holdings and track performance</p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-white/10 flex flex-col items-end">
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">Total Portfolio Value</p>
                        <p className="text-3xl font-bold">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </header>

                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                    >
                        <span>+</span> Record Transaction
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Holdings Section */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold px-2">Holdings</h2>
                            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            <th className="px-6 py-4">Symbol</th>
                                            <th className="px-6 py-4">Asset Type</th>
                                            <th className="px-6 py-4">Units</th>
                                            <th className="px-6 py-4">Avg Price</th>
                                            <th className="px-6 py-4">Cost Basis</th>
                                            <th className="px-6 py-4 text-right">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {investments.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No holdings found. Start by recording a transaction.</td>
                                            </tr>
                                        ) : investments.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <span className="font-bold text-blue-400 group-hover:text-blue-300">{inv.symbol}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs bg-white/5 px-2 py-1 rounded-md capitalize">{inv.asset_type.replace('_', ' ')}</span>
                                                </td>
                                                <td className="px-6 py-5 font-medium">{inv.units.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                                                <td className="px-6 py-5 text-slate-400">${inv.avg_buy_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-5 text-slate-400">${inv.cost_basis.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-5 text-right font-bold">${inv.current_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Transactions History */}
                        <section className="space-y-4">
                            <h2 className="text-2xl font-bold px-2">Transaction History</h2>
                            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Symbol</th>
                                            <th className="px-6 py-4">Quantity</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No transactions recorded yet.</td>
                                            </tr>
                                        ) : transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-5 text-slate-400 text-sm">
                                                    {new Date(tx.executed_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${tx.type === 'buy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                        }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 font-bold uppercase">{tx.symbol}</td>
                                                <td className="px-6 py-5 font-medium">{tx.quantity.toLocaleString()}</td>
                                                <td className="px-6 py-5 text-slate-400">${tx.price.toLocaleString()}</td>
                                                <td className="px-6 py-5 text-right font-bold">
                                                    ${((tx.quantity * tx.price) + (tx.type === 'buy' ? tx.fees : -tx.fees)).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Add Transaction Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full space-y-6 shadow-2xl relative">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Record Transaction</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 ml-1">Symbol</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 uppercase"
                                        placeholder="AAPL"
                                        value={newTx.symbol}
                                        onChange={(e) => setNewTx({ ...newTx, symbol: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 ml-1">Type</label>
                                    <select
                                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                        value={newTx.type}
                                        onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                                    >
                                        <option value="buy">Buy</option>
                                        <option value="sell">Sell</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 ml-1">Asset Type</label>
                                <select
                                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                    value={newTx.asset_type}
                                    onChange={(e) => setNewTx({ ...newTx, asset_type: e.target.value })}
                                >
                                    <option value="stock">Stock</option>
                                    <option value="etf">ETF</option>
                                    <option value="mutual_fund">Mutual Fund</option>
                                    <option value="bond">Bond</option>
                                    <option value="cash">Cash</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 ml-1">Quantity</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        required
                                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                        placeholder="10"
                                        value={newTx.quantity}
                                        onChange={(e) => setNewTx({ ...newTx, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 ml-1">Price per Unit</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                        placeholder="150"
                                        value={newTx.price}
                                        onChange={(e) => setNewTx({ ...newTx, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 ml-1">Fees ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                    placeholder="0"
                                    value={newTx.fees}
                                    onChange={(e) => setNewTx({ ...newTx, fees: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-blue-600/20 mt-4">
                                Confirm Trade
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
