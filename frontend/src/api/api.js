import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const submitRiskAssessment = async (answers) => {
  try {
    const response = await axios.post(`${API_URL}/risk-assessment`, {
      answers,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};
