import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    axios.get("http://127.0.0.1:8000/api/v1/auth/profile/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        setAuthorized(true);
        setProfileCompleted(res.data.profile_completed);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        setAuthorized(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-white">Checking access...</div>;

  if (!authorized) return <Navigate to="/login" />;

  if (!profileCompleted) return <Navigate to="/kyc" />;

  return children;
}

export default ProtectedRoute;
