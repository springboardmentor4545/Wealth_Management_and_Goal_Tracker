import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `text-[14px] font-medium transition ${
      isActive ? "text-textPrimary" : "text-textSecondary hover:text-textPrimary"
    }`;

  return (
    <div className="min-h-screen bg-appBg">
      <header className="bg-cardBg border-b border-borderLight">
        <div className="w-full px-6 py-4 flex items-center">
          <div className="flex-1 text-[16px] font-semibold text-textPrimary">
            Wealth Management
          </div>

          <nav className="flex-1 flex items-center justify-center gap-6">
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/goals" className={linkClass}>
              Goals
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
          </nav>

          <div className="flex-1 flex justify-end">
            <button
              onClick={handleLogout}
              className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
