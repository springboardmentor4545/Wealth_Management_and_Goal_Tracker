import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        fetchData();

        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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

    const handleSearch = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const res = await axios.get(`http://127.0.0.1:8000/api/v1/portfolio/search?q=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(res.data);
            setShowDropdown(true);
        } catch (err) {
            console.error("Search error:", err);
        }
    };

    const debounceTimeout = useRef(null);
    const debouncedSearch = (query) => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => handleSearch(query), 500);
    };

    const selectSymbol = (quote) => {
        setNewTx({
            ...newTx,
            symbol: quote.symbol,
            asset_type: quote.type === 'EQUITY' ? 'stock' : (quote.type === 'ETF' ? 'etf' : newTx.asset_type)
        });
        setShowDropdown(false);
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

    const handleRefreshPrices = async () => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.post("http://127.0.0.1:8000/api/v1/portfolio/update-prices", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Price update task triggered! Please wait a moment.");
            setTimeout(fetchData, 3000);
        } catch (err) {
            toast.error("Failed to trigger price update");
        }
    };

    const totalPortfolioValue = useMemo(() => {
        return investments.reduce((acc, inv) => acc + (inv.current_value || 0), 0);
    }, [investments]);

    return (
        <div className="min-h-screen bg-[#020617] p-6 md:p-10 relative font-sans text-white overflow-x-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.05)_0%,transparent_50%)]"></div>

            <div className="relative max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
                <Navbar />

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-2">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500">My Wealth</h2>
                        <h1 className="text-5xl font-black tracking-tight">Portfolio</h1>
                        <p className="text-slate-400 font-medium">Track your investments and performance.</p>
                    </div>

                    <div className="glass-card px-10 py-6 border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent flex flex-col items-end">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-2">Total Value</p>
                        <p className="text-4xl font-black text-white tracking-tighter">
                            ₹{totalPortfolioValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </header>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleRefreshPrices}
                        className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest border border-white/5 transition-all flex items-center gap-2 group"
                    >
                        <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Refresh Prices
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                    >
                        <span>+</span> Record Transaction
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* Holdings Section */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4 px-2">
                                <h2 className="text-2xl font-black tracking-tight">Active Holdings</h2>
                                <div className="h-[1px] flex-1 bg-white/5"></div>
                            </div>

                            <div className="glass-card border-white/5 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                                <th className="px-8 py-5">Symbol</th>
                                                <th className="px-8 py-5">Units</th>
                                                <th className="px-8 py-5">Avg Buy</th>
                                                <th className="px-8 py-5">Market Price</th>
                                                <th className="px-8 py-5 text-right">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {investments.filter(inv => inv.units > 0).length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-500 font-medium">No active holdings found. Record a transaction to start tracking.</td>
                                                </tr>
                                            ) : investments.filter(inv => inv.units > 0).map((inv) => {
                                                const profit = (inv.last_price !== null && inv.avg_buy_price > 0) ? (inv.last_price - inv.avg_buy_price) : 0;
                                                const profitPct = (inv.avg_buy_price > 0) ? (profit / inv.avg_buy_price) * 100 : 0;

                                                return (
                                                    <tr key={inv.id} className="hover:bg-blue-600/[0.03] transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="font-black text-blue-400 group-hover:text-blue-300 transition-colors uppercase tracking-tight">{inv.symbol}</div>
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                                {inv.last_price_at ? `Updated: ${new Date(inv.last_price_at).toLocaleTimeString()}` : 'No update yet'}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 font-bold text-slate-200">{inv.units.toLocaleString('en-IN', { maximumFractionDigits: 4 })}</td>
                                                        <td className="px-8 py-6 text-slate-400 font-medium">₹{inv.avg_buy_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-white">
                                                                    {inv.last_price !== null
                                                                        ? `₹${inv.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                                                        : '₹---'}
                                                                </span>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${inv.last_price !== null ? (profit >= 0 ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-600'}`}>
                                                                    {inv.last_price !== null ? `${profit >= 0 ? '▲' : '▼'} ${Math.abs(profitPct).toFixed(2)}%` : '---'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right font-black text-white tracking-tight">
                                                            ₹{inv.current_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>

                        {/* Transactions History */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4 px-2">
                                <h2 className="text-2xl font-black tracking-tight text-slate-300">Transaction History</h2>
                                <div className="h-[1px] flex-1 bg-white/5"></div>
                            </div>

                            <div className="glass-card border-white/5 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/[0.01] text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                                                <th className="px-8 py-5">Date</th>
                                                <th className="px-8 py-5">Type</th>
                                                <th className="px-8 py-5">Asset</th>
                                                <th className="px-8 py-5 text-right">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-16 text-center text-slate-600 font-medium">No transactions recorded yet.</td>
                                                </tr>
                                            ) : transactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-8 py-6 text-slate-500 font-bold text-xs tabular-nums uppercase">
                                                        {new Date(tx.executed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${tx.type === 'buy'
                                                            ? 'bg-blue-600/10 border-blue-600/20 text-blue-400'
                                                            : 'bg-rose-600/10 border-rose-600/20 text-rose-400'
                                                            }`}>
                                                            {tx.type === 'buy' ? 'Buy' : 'Sell'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="font-bold text-slate-200 uppercase tracking-wider">{tx.symbol}</div>
                                                        <div className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{tx.quantity} Units @ ₹{tx.price.toLocaleString()}</div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-black text-white tabular-nums">
                                                        ₹{((tx.quantity * tx.price) + (tx.type === 'buy' ? tx.fees : -tx.fees)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Transaction Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card bg-[#0f172a] border-white/10 p-10 max-w-xl w-full space-y-8 shadow-2xl relative animate-in zoom-in slide-in-from-bottom-8 duration-500 overflow-visible">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-blue-500 mb-1">New Entry</h2>
                                <h3 className="text-3xl font-black tracking-tight">Record Transaction</h3>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddTransaction} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2 relative" ref={searchRef}>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Symbol</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all uppercase font-bold focus:bg-white/[0.08]"
                                        placeholder="Search..."
                                        value={newTx.symbol}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setNewTx({ ...newTx, symbol: val });
                                            debouncedSearch(val);
                                        }}
                                        onFocus={() => {
                                            if (searchResults.length > 0) setShowDropdown(true);
                                        }}
                                    />

                                    {showDropdown && searchResults.length > 0 && (
                                        <div className="absolute z-[110] mt-2 w-full glass-morphism rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {searchResults.map((quote, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => selectSymbol(quote)}
                                                    className="px-5 py-4 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 last:border-0 transition-all"
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-black text-blue-400 text-sm">{quote.symbol}</span>
                                                        <span className="text-[9px] font-black uppercase bg-white/10 px-2 py-0.5 rounded-lg text-slate-400 border border-white/5">{quote.type}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-300 font-medium truncate">{quote.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Type</label>
                                    <select
                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold appearance-none cursor-pointer"
                                        value={newTx.type}
                                        onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
                                    >
                                        <option value="buy" className="bg-[#0f172a]">Buy</option>
                                        <option value="sell" className="bg-[#0f172a]">Sell</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Asset Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['stock', 'etf', 'bond'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setNewTx({ ...newTx, asset_type: type })}
                                            className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${newTx.asset_type === type
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                                                : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Quantity</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        required
                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold tabular-nums"
                                        placeholder="0.00"
                                        value={newTx.quantity}
                                        onChange={(e) => setNewTx({ ...newTx, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Price per Unit</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold tabular-nums"
                                        placeholder="₹0.00"
                                        value={newTx.price}
                                        onChange={(e) => setNewTx({ ...newTx, price: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Processing Fees (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold tabular-nums"
                                    placeholder="0.00"
                                    value={newTx.fees}
                                    onChange={(e) => setNewTx({ ...newTx, fees: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-[1.25rem] text-sm font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl shadow-blue-600/30 mt-6 active:scale-[0.98]">
                                Record Transaction
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
