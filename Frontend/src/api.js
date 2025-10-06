// src/api.js
import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: "/api", // Your Flask backend URL
});

// Automatically attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Get token from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
