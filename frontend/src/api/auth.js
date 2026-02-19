import axios from "axios";

const API_URL = "http://127.0.0.1:8000/auth";

// ================= SIGN UP =================
export const signupUser = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/signup`, data);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Signup failed");
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
    }

    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.detail || "Login failed");
  }
};

// ================= LOGOUT =================
export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");
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
  } catch {
    return null;
  }
};

// ================= AUTH CHECK =================
export const isAuthenticated = () => {
  return !!getToken();
};
