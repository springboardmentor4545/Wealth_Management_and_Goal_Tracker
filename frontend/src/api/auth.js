import axios from "axios";

// ✅ One base URL for everything
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
// Your backend auth router is under /auth
const API_URL = `${API_BASE}/auth`;

/**
 * NOTE:
 * - API file should NOT show toast/alert.
 * - API should throw errors; UI pages will catch and show toast.
 */

export const signupUser = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/signup`, data);
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.detail || "Signup failed";
    throw new Error(msg);
  }
};

export const loginUser = async (data) => {
  try {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);

    const res = await axios.post(`${API_URL}/login`, formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // Store token
    if (res.data?.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("token_type", res.data.token_type || "bearer");
    }

    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.detail || "Login failed";
    throw new Error(msg);
  }
};


export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");
};

export const getToken = () => localStorage.getItem("access_token");

export const isAuthenticated = () => !!getToken();

// Get current user info: GET /auth/me
export const getCurrentUser = async () => {
  const token = getToken();
  if (!token) throw new Error("No authentication token found");

  try {
    const res = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.detail || "Failed to fetch current user";
    throw new Error(msg);
  }
};
