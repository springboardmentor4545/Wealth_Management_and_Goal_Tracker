import axios from "axios";

const API_URL = "http://127.0.0.1:8000"; 

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
    const res = await axios.post(`${API_URL}/login`, data);
    return res.data; 
  } catch (err) {
    alert(err.response?.data?.detail || "Login failed");
    return null;
  }
};
