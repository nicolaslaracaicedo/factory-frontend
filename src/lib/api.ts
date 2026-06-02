import axios from "axios";

const api = axios.create({
  baseURL: "/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor para errores globales
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("API 401 — la sesión podría haber expirado");
    }
    return Promise.reject(error);
  }
);

export default api;