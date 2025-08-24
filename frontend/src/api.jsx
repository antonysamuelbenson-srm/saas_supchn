// src/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:5500", // Your backend URL
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(config => {
  // Assumes you store the token in localStorage after login
  const token = localStorage.getItem('authToken'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default apiClient;