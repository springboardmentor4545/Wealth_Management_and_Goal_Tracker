import axios from "axios";

const API_URL = "http://localhost:8000";

export const getRiskQuestions = async () => {
  try {
    const response = await axios.get(`${API_URL}/risk/questions`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitRiskAssessment = async (answers, userId, kycStatus) => {
  try {
    const response = await axios.post(`${API_URL}/risk/assessment`, {
      answers,
      user_id: userId,
      kyc_status: kycStatus,
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};
