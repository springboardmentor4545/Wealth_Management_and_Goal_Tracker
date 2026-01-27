import api from "./api";

// 🔹 GET goals (SECURE — no userId)
export const getGoals = async () => {
  const res = await api.get("/goals");
  return res.data;
};

// 🔹 CREATE goal
export const createGoal = async (goalData) => {
  const res = await api.post("/goals", goalData);
  return res.data;
};

// 🔹 UPDATE goal
export const updateGoal = async (goalId, goalData) => {
  const res = await api.put(`/goals/${goalId}`, goalData);
  return res.data;
};

// 🔹 DELETE goal
export const deleteGoal = async (goalId) => {
  const res = await api.delete(`/goals/${goalId}`);
  return res.data;
};
