import axios from "axios";

/*const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
});*/

const API_URL = "http://localhost:8000";

/*
 🔐 Axios instance with credentials + JWT
*/
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/*
 ✅ Automatically attach JWT token if present
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ===============================
   RISK MODULE 
   =============================== */

export const getRiskQuestions = async () => {
  try {
    const response = await api.get("/risk/questions");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitRiskAssessment = async (answers, userId, kycStatus) => {
  try {
    const response = await api.post("/risk/assessment", {
      answers,
      user_id: userId,      
      kyc_status: kycStatus 
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;
