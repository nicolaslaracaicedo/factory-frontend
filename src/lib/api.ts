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
    if (typeof window !== "undefined" && error.response?.status === 401) {
      void fetch("/api/session/logout", { method: "POST" });
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default api;