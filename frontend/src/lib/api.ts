import axios from "axios";

export const KEY = {
    auth_token : 'auth_token',
    user_info : 'user_info',
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    if (typeof payload === "string" && payload.trim()) {
      return payload.trim();
    }

    if (payload && typeof payload === "object") {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message.trim();
      }

      const errorText = (payload as { error?: unknown }).error;
      if (typeof errorText === "string" && errorText.trim()) {
        return errorText.trim();
      }
    }

    if (error.response?.status === 401) {
      return "Invalid username or password.";
    }
    if (error.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (error.response?.status === 404) {
      return "Requested resource was not found.";
    }
    if (error.response?.status && error.response.status >= 500) {
      return "Server error occurred. Please try again shortly.";
    }

    if (error.code === "ECONNABORTED" || (error.message && error.message.toLowerCase().includes("timeout"))) {
      return "Request timed out. Please check your connection and try again.";
    }

    if (error.message && error.message.toLowerCase().includes("network")) {
      return "Network error. Please check your internet connection.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(KEY.auth_token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto-logout on 401 (token expired or invalid)
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Only redirect if we're in the browser and not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        localStorage.removeItem(KEY.auth_token);
        localStorage.removeItem(KEY.user_info);
        window.location.href = '/login';
      }
    }
    // Attach a user-friendly message but preserve the original error for status code checks
    const message = getApiErrorMessage(error);
    return Promise.reject(new Error(message));
  }
);

export default api;