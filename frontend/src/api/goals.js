import axios from "axios";
import { getToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_URL = `${API_BASE}/goals`;

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getGoals = async () => {
  try {
    const res = await axios.get(API_URL, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.detail || "Failed to load goals";
    throw new Error(msg);
  }
};

export const createGoal = async (data) => {
  try {
    const res = await axios.post(API_URL, data, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.detail || "Failed to create goal";
    throw new Error(msg);
  }
};

export const updateGoal = async (id, data) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.detail || "Failed to update goal";
    throw new Error(msg);
  }
};

export const deleteGoal = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.detail || "Failed to delete goal";
    throw new Error(msg);
  }
};
