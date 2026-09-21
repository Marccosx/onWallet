import axios from "axios";

const api = axios.create({
  // Production requests use the Vercel proxy so the session cookie is same-site.
  baseURL: import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3333"),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
    window.dispatchEvent(new Event('onwallet:unauthorized'));
  }
  return Promise.reject(error);
});

export { api };
