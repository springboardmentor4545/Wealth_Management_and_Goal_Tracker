import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Navbar() {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.clear();
        toast.success("Successfully logged out");
        navigate("/login");
    };

    return (
        <nav className="flex justify-between items-center bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">W</div>
                <span className="text-xl font-bold tracking-tight text-white">WealthTracker</span>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/portfolio")}
                    className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 transition-all text-white"
                >
                    Portfolio
                </button>
                <button
                    onClick={() => navigate("/goals")}
                    className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 transition-all text-white"
                >
                    Goals
                </button>
                <button
                    onClick={() => navigate("/profile")}
                    className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 transition-all text-white"
                >
                    Profile
                </button>
                <button
                    onClick={logout}
                    className="text-slate-400 hover:text-red-400 p-2 transition-colors"
                    title="Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                </button>
            </div>
        </nav>
    );
}
