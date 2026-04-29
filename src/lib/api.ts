import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_URL ??
    "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para token auth
api.interceptors.request.use((config) => {
  let token: string | null = null;

  if (typeof window !== "undefined") {
    const persistedAuth = localStorage.getItem("factory_auth");
    if (persistedAuth) {
      try {
        const parsed = JSON.parse(persistedAuth) as {
          state?: { token?: string | null };
        };
        token = parsed?.state?.token ?? null;
      } catch {
        token = null;
      }
    }
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor para errores globales
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      // Redirigir a login
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;