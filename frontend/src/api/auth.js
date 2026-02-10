import axios from "axios";
import { toast } from "react-toastify";

const API_URL = "http://127.0.0.1:8000/auth";

// ================= SIGN UP =================
export const signupUser = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/signup`, data);
    toast.success("Signup successful");
    return res.data;
  } catch (err) {
    toast.error(err.response?.data?.detail || "Signup failed");
    return null;
  }
};

// ================= LOGIN =================
export const loginUser = async (data) => {
  try {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);

    const res = await axios.post(`${API_URL}/login`, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (res.data?.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("token_type", res.data.token_type);
      toast.success("Login successful");
    }

    return res.data;
  } catch (err) {
    toast.error(err.response?.data?.detail || "Login failed");
    return null;
  }
};

// ================= LOGOUT =================
export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");
  toast.info("Logged out");
};

// ================= TOKEN =================
export const getToken = () => {
  return localStorage.getItem("access_token");
};

// ================= CURRENT USER =================
export const getCurrentUser = async () => {
  try {
    const token = getToken();
    if (!token) return null;

    const res = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (err) {
    toast.error("Failed to get current user");
    return null;
  }
};

// ================= AUTH CHECK =================
export const isAuthenticated = () => {
  return !!getToken();
};
