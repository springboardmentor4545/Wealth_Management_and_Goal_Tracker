import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const name = localStorage.getItem("name") || "User";

  return (
    <div className="min-h-screen bg-[#020617] p-6 md:p-10 relative font-sans text-white overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08)_0%,transparent_50%)]"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.08)_0%,transparent_50%)]"></div>

      <div className="relative max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        <Navbar />

        <header className="px-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight animate-in slide-in-from-left-8 duration-1000">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">{name}</span>
          </h1>
        </header>

        {/* Placeholder for future dashboard content */}
        <main className="w-full h-[60vh] flex items-center justify-center">
          <div className="opacity-[0.03] pointer-events-none select-none">
            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
        </main>
      </div>
    </div>
  );
}
