import axios from "axios";

const API_URL = "http://localhost:8000";

// 🔐 Helper: get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

// =========================
// GET RISK QUESTIONS
// =========================
export const getRiskQuestions = async () => {
  try {
    const response = await axios.get(`${API_URL}/risk/questions`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// =========================
// SUBMIT RISK ASSESSMENT
// =========================
export const submitRiskAssessment = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/risk/assessment`,
      payload,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
