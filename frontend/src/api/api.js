import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// ---------- AUTH APIS ----------

// SIGNUP
export const signupUser = (data) => {
  return API.post("/auth/signup", data);
};

// LOGIN (OAuth2PasswordRequestForm)
export const loginUser = (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  return API.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export default API;
