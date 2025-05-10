import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api/v1",
    timeout: 5000, // Add a timeout
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;