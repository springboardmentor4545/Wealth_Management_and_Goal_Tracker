const BASE_URL = "http://localhost:8000/auth";

/* Signup API */
export const signupUser = async (userData) => {
  const response = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Signup failed");
  }

  return response.json();
};

/* Login API */
export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Login failed");
  }

  return response.json();
};
