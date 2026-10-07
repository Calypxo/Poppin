import axios from "axios";
import { session } from "../auth/session";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = session.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith("/auth/login")
    ) {
      session.clear();
      window.dispatchEvent(new Event("poppin:session-expired"));
    }
    return Promise.reject(error);
  },
);
export default api;
