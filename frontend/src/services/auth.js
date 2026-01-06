import api from "./api";

export const loginUser = (data) =>
  api.post("/login", data);

export const signupUser = (data) =>
  api.post("/signup", data);

const API_URL = "http://127.0.0.1:8000";

