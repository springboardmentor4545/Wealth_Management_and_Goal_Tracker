import axios from "axios";
import { getToken } from "./auth";

const API_URL = "http://127.0.0.1:8000/portfolio";

// =======================
// BUY ASSET
// =======================
export const buyAsset = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/buy`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Buy asset error:", err.response?.data || err.message);
    throw err;
  }
};

// =======================
// SELL ASSET
// =======================
export const sellAsset = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/sell`, payload, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Sell asset error:", err.response?.data || err.message);
    throw err;
  }
};

// =======================
// GET HOLDINGS  ✅ FIXED
// =======================
export const getHoldings = async () => {
  try {
    const res = await axios.get(`${API_URL}/holdings`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Get holdings error:", err.response?.data || err.message);
    throw err;
  }
};

// =======================
// GET TRANSACTIONS  ✅ FIXED
// =======================
export const getTransactions = async () => {
  try {
    const res = await axios.get(`${API_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Get transactions error:", err.response?.data || err.message);
    throw err;
  }
};
