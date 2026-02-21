import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const logout = () => {
        localStorage.clear();
        toast.success("Successfully logged out");
        navigate("/login");
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass-card px-8 py-4 border-white/5 flex justify-between items-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/[0.03] to-blue-400/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div
                className="flex items-center gap-3 cursor-pointer relative z-10"
                onClick={() => navigate("/dashboard")}
            >
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/20 transform group-hover:scale-110 transition-transform duration-500">W</div>
                <div className="flex flex-col">
                    <span className="text-xl font-black tracking-tight text-white leading-none">WealthTracker</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mt-1">Portfolio Manager</span>
                </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
                {[
                    { name: 'Dashboard', path: '/dashboard' },
                    { name: 'Portfolio', path: '/portfolio' },
                    { name: 'Goals', path: '/goals' },
                    { name: 'Simulations', path: '/simulations' },
                    { name: 'Recommendations', path: '/recommendations' },
                    { name: 'Profile', path: '/profile' }
                ].map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isActive(item.path)
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-white'
                            }`}
                    >
                        {item.name}
                    </button>
                ))}

                <div className="w-[1px] h-6 bg-white/10 mx-2"></div>

                <button
                    onClick={logout}
                    className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 shadow-lg shadow-rose-500/5 active:scale-95"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
