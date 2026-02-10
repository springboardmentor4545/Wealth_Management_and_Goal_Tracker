import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logoutUser } from "../api/auth";
import { toast } from "react-toastify";
import axios from "axios";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      if (!u) {
        toast.error("Please login again");
        navigate("/login");
        return;
      }
      setUser(u);
    })();
  }, [navigate]);

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out");
    navigate("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirm) {
      toast.error("Fill all fields");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSaving(true);
      await axios.put("http://127.0.0.1:8000/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      toast.success("Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Password update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff3c4] via-[#f5c16c] to-[#c47a1a] p-8">
      {/* Top bar */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-10">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 backdrop-blur-md hover:bg-white shadow-md"
        >
          <span className="text-xl">←</span>
          <span className="font-semibold text-amber-900">Back</span>
        </button>

        <h1 className="text-5xl font-extrabold text-amber-900 tracking-wide">
          My Profile
        </h1>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-md"
        >
          Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Details */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/40">
          <h2 className="text-2xl font-bold text-amber-800 mb-6">
            Profile Details
          </h2>

          {!user ? (
            <p className="text-gray-600">Loading...</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-xl font-semibold text-gray-900">
                  {user.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-xl font-semibold text-gray-900">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Risk Profile</p>
                <p className="text-xl font-semibold capitalize text-gray-900">
                  {user.risk_profile}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">KYC Status</p>
                <p className="inline-block mt-1 px-4 py-1 rounded-full bg-amber-200 text-amber-900 font-semibold capitalize">
                  {user.kyc_status}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/40">
          <h2 className="text-2xl font-bold text-amber-800 mb-6">
            Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Old password"
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="New password"
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl shadow-lg"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4">
            Password update requires backend endpoint{" "}
            <b>/auth/change-password</b>
          </p>
        </div>
      </div>
    </div>
  );
}
