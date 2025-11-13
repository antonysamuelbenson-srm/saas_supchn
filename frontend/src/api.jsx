// src/api.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5001", // <-- backend now at port 5001
  headers: {
    "Content-Type": "application/json"
  }
});

// Add JWT to every request
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default apiClient;
