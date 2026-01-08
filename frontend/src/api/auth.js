import axios from "axios";

const API_URL = "http://127.0.0.1:8000/auth"; 

export const signupUser = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/signup`, data);
    return res.data; 
  } catch (err) {
    alert(err.response?.data?.detail || "Signup failed");
    return null;
  }
};

export const loginUser = async (data) => {
  try {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);

    const res = await axios.post(`${API_URL}/login`, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    
    // Store the token in localStorage
    if (res.data.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("token_type", res.data.token_type);
    }
    
    return res.data; 
  } catch (err) {
    alert(err.response?.data?.detail || "Login failed");
    return null;
  }
};

// Logout function
export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token_type");
};

// Get current token
export const getToken = () => {
  return localStorage.getItem("access_token");
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};
