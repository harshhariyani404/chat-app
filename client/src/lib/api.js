import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { clearSession, getAuthToken } from "./storage";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
    }

    return Promise.reject(error);
  }
);
