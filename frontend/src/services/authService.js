import axios from "axios";

const API = "http://127.0.0.1:8000/api/v1";

export const registerUser = async (data) => {
// Create FormData for register - FastAPI expects form-encoded data
  const formData = new FormData();
  formData.append("username", data.email.split('@')[0]);
  formData.append("email", data.email);
  formData.append("password", data.password);
  formData.append("full_name", data.email.split('@')[0]);
  formData.append("kyc_completed", "false");
  formData.append("kyc_status", "pending");
  formData.append("profile_completed", "false");
  formData.append("risk_score", "0");
  formData.append("risk_level", "unknown");

  const res = await axios.post(
    `${API}/auth/register`,
    formData
    // Note: Don't specify content-type header, axios will set it for FormData
  );
  return res.data;
  };


export const loginUser = async (data) => {
  // Create FormData for login - FastAPI expects form-encoded data
  const formData = new FormData();
  formData.append("username", data.username);
  formData.append("password", data.password);

  const res = await axios.post(
    `${API}/auth/login`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );

  return res.data;
};
