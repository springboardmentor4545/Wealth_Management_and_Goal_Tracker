import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully ✅");
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  return (
    <header className="h-20 flex items-center justify-center relative px-6">
      <h1 className="text-3xl font-semibold text-white text-center mb-1 ">
          Wealth Management
        </h1>
      {token && (
        <div className="absolute right-6 flex items-center gap-4">
          
          <Link
            to="/portfolio"
            className="flex items-center gap-2 text-white hover:text-blue-50 transition font-normal"
          >
            Portfolio
          </Link>

          <Link
            to="/goals"
            className="flex items-center gap-2 text-white hover:text-blue-50 transition font-normal"
          >
            Goals
          </Link>

          
          <button
            onClick={handleLogout}
            className="bg-white px-4 py-1 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
