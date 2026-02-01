import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem("name") || "User";

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 relative font-sans text-white">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>

      <div className="relative max-w-6xl mx-auto space-y-8">
        <Navbar />

        <main className="bg-white/5 backdrop-blur-md p-20 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-3xl font-bold">Welcome back, <span className="text-blue-400">{name}</span></h2>
          <p className="text-slate-400 max-w-lg">Your wealth journey is in progress.</p>
        </main>
      </div>
    </div>
  );
}
