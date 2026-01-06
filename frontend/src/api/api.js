const API_BASE_URL = "http://localhost:8000";

// Signup API call
export const signup = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Signup failed");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Login API call
export const login = async (email, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Login failed");
    }

    // Store the token in localStorage
    localStorage.setItem("access_token", data.access_token);

    return data;
  } catch (error) {
    throw error;
  }
};

// Logout function
export const logout = () => {
  localStorage.removeItem("access_token");
};

// Get current token
export const getToken = () => {
  return localStorage.getItem("access_token");
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};
