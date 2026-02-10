import React, { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Portfolio({ token, onBack }) {
    const [holdings, setHoldings] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    
    // Form State
    const [showForm, setShowForm] = useState(false)
    const [symbol, setSymbol] = useState('')
    const [type, setType] = useState('BUY')
    const [qty, setQty] = useState('')
    const [price, setPrice] = useState('')
    const [msg, setMsg] = useState(null)

    useEffect(() => {
        loadData()
    }, [token])

    const loadData = async () => {
        setLoading(true)
        const [hRes, tRes] = await Promise.all([
            api.getHoldings(token),
            api.getTransactions(token)
        ])
        
        if (hRes.status === 200) setHoldings(hRes.body)
        if (tRes.status === 200) setTransactions(tRes.body)
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMsg(null)
        
        const payload = {
            symbol: symbol.toUpperCase(),
            transaction_type: type,
            quantity: parseFloat(qty),
            price_per_unit: parseFloat(price),
            asset_type: 'Stock' // Default for now
        }

        const res = await api.createTransaction(payload, token)
        if (res.status === 200) {
            setShowForm(false)
            setSymbol(''); setQty(''); setPrice('')
            loadData() // Refresh tables
        } else {
            setMsg(res.body.detail || "Transaction failed.")
        }
    }

    // Calculate Totals
    const totalPortfolioValue = holdings.reduce((acc, h) => acc + (h.current_value || (h.quantity * h.average_buy_price)), 0)

    return (
        <div className="bg-gray-50 min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-gray-500 hover:text-blue-600">← Back</button>
                    <h1 className="text-xl font-bold text-gray-800">My Portfolio</h1>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    {showForm ? 'Cancel' : '+ Add Transaction'}
                </button>
            </div>

            <div className="max-w-6xl mx-auto px-4 space-y-8">
                
                {/* Portfolio Summary Card */}
                <div className="bg-indigo-900 rounded-2xl p-8 text-white shadow-xl flex justify-between items-end relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="text-indigo-200 text-sm font-medium uppercase tracking-wider">Total Portfolio Value</span>
                        <div className="text-4xl font-extrabold mt-2">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="text-sm text-indigo-300 mt-1">across {holdings.length} assets</div>
                    </div>
                    {/* Decorative */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-700 opacity-20 rounded-full blur-3xl"></div>
                </div>

                {/* Transaction Form */}
                {showForm && (
                     <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in-down">
                        <h2 className="text-lg font-bold mb-4 text-gray-800">Record New Transaction</h2>
                        {msg && <div className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{msg}</div>}
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={type} onChange={e=>setType(e.target.value)}>
                                    <option value="BUY">Buy</option>
                                    <option value="SELL">Sell</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Symbol (e.g. AAPL)</label>
                                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="AAPL" value={symbol} onChange={e=>setSymbol(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                                <input required type="number" step="any" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="10" value={qty} onChange={e=>setQty(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Price per Unit ($)</label>
                                <input required type="number" step="any" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="150.00" value={price} onChange={e=>setPrice(e.target.value)} />
                            </div>
                            <div>
                                <button type="submit" className={`w-full font-bold py-2 rounded-lg transition-colors text-white ${type==='BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                                    {type}
                                </button>
                            </div>
                        </form>
                     </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Holdings Table */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 text-lg">Current Holdings</h3>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {holdings.length === 0 ? (
                                <div className="p-10 text-center text-gray-400">No assets owned. Add a 'Buy' transaction.</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3">Asset</th>
                                            <th className="px-6 py-3 text-right">Units</th>
                                            <th className="px-6 py-3 text-right">Avg Price</th>
                                            <th className="px-6 py-3 text-right">Market Price</th>
                                            <th className="px-6 py-3 text-right">Market Value</th>
                                            <th className="px-6 py-3 text-right">P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {holdings.map((h, i) => {
                                            const mktPrice = h.last_price || h.average_buy_price;
                                            const mktValue = h.quantity * mktPrice;
                                            const costBasis = h.quantity * h.average_buy_price;
                                            const pnl = mktValue - costBasis;
                                            const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

                                            return (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3 font-medium text-gray-900">
                                                        {h.symbol}
                                                        <div className="text-[10px] text-gray-400 font-normal">
                                                            {h.last_price_updated_at ? `Updated: ${new Date(h.last_price_updated_at).toLocaleTimeString()}` : 'Price Pending...'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-right">{h.quantity}</td>
                                                    <td className="px-6 py-3 text-right text-gray-500">${h.average_buy_price.toFixed(2)}</td>
                                                    <td className="px-6 py-3 text-right text-indigo-600 font-medium">${mktPrice.toFixed(2)}</td>
                                                    <td className="px-6 py-3 text-right font-bold text-gray-800">${mktValue.toFixed(2)}</td>
                                                    <td className={`px-6 py-3 text-right font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                                                        <span className="text-xs ml-1">({pnlPct.toFixed(1)}%)</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg mb-4">History</h3>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-h-[500px] overflow-y-auto">
                            {transactions.length === 0 ? (
                                <div className="p-6 text-center text-gray-400 text-sm">No transaction history.</div>
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {transactions.map((tx) => (
                                        <li key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${tx.transaction_type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {tx.transaction_type}
                                                </span>
                                                <span className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-gray-800">{tx.symbol}</span>
                                                <div className="text-right">
                                                    <div className="font-medium text-sm">{tx.quantity} @ ${tx.price_per_unit}</div>
                                                    <div className="text-xs text-gray-500">Total: ${tx.total_amount.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
