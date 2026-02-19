import axios from "axios";
import { getToken } from "./auth";

const API_URL = "http://127.0.0.1:8000/goals";

// helper: auth header
const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// =======================
// FETCH ALL GOALS
// =======================
export const fetchGoals = async () => {
  try {
    const res = await axios.get(`${API_URL}/`, authHeader());
    return res.data;
  } catch (err) {
    console.error("Fetch goals error:", err.response?.data || err.message);
    throw err;
  }
};

// =======================
// ADD GOAL
// =======================
export const addGoal = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/`, payload, authHeader());
    return res.data;
  } catch (err) {
    console.error("Add goal error:", err.response?.data || err.message);
    throw err;
  }
};

// =======================
// UPDATE GOAL
// =======================
export const updateGoal = async (goal_id, payload) => {
  try {
    const res = await axios.put(
      `${API_URL}/${goal_id}`,
      payload,
      authHeader()
    );
    return res.data;
  } catch (err) {
    console.error("Update goal error:", err.response?.data || err.message);
    throw err;
  }
};

// =======================
// DELETE GOAL
// =======================
export const deleteGoal = async (goal_id) => {
  try {
    const res = await axios.delete(
      `${API_URL}/${goal_id}`,
      authHeader()
    );
    return res.data;
  } catch (err) {
    console.error("Delete goal error:", err.response?.data || err.message);
    throw err;
  }
};
