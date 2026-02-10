import axios from "axios";

const API_URL = "http://127.0.0.1:8000/portfolio";

// =======================
// BUY ASSET
// =======================
export const buyAsset = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/buy`, payload);
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
    const res = await axios.post(`${API_URL}/sell`, payload);
    return res.data;
  } catch (err) {
    console.error("Sell asset error:", err.response?.data || err.message);
    throw err;
  }
};

// =======================
// GET HOLDINGS
// =======================
export const getHoldings = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/holdings/${userId}`);
    return res.data;
  } catch (err) {
    console.error("Get holdings error:", err.response?.data || err.message);
    throw err;
  }
};

// =======================
// GET TRANSACTIONS (optional, if needed later)
// =======================
export const getTransactions = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/transactions/${userId}`);
    return res.data;
  } catch (err) {
    console.error("Get transactions error:", err.response?.data || err.message);
    throw err;
  }
};
