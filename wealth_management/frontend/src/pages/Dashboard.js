import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
      navigate("/");
    }
  }, [navigate]);

  if (!user) {
    return <p className="p-6 text-center">Loading user info...</p>;
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="flex items-start justify-center pt-20 pb-16">
        <div className="bg-white p-6 rounded-xl shadow-[0px_6px_11px_0px_rgba(0,0,0,0.8)] w-2/3 max-w-4xl text-center">
          <h2 className="text-xl font-bold mb-4">
            Welcome, {user.name} 👋
          </h2>

          <p className="text-gray-700 text-base">
            Manage your financial goals and track your progress easily with our platform.
          </p>
        </div>
      </div>
    </div>
  );
}
