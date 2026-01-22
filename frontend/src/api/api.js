import axios from "axios";

const API_URL = "http://localhost:8000";

const token = localStorage.getItem("access_token");

axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const getRiskQuestions = async () => {
  const res = await axios.get(`${API_URL}/risk/questions`);
  return res.data;
};

export const submitRiskAssessment = (answers, userId) => {
  return axios.post(`${API_URL}/risk/assessment`, {
    user_id: userId,
    answers: answers
  });
};
