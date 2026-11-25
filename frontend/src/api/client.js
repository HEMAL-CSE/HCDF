import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

let accessToken = null;
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api.post("/auth/refresh").then((response) => {
      const token = response.data?.data?.access_token;
      setAccessToken(token);
      return token;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = original?.url || "";
    const isAuthRequest = ["/auth/login", "/auth/refresh", "/auth/logout"].some((path) => url.includes(path));
    if (error.response?.status !== 401 || !original || original._retry || isAuthRequest) {
      return Promise.reject(error);
    }
    original._retry = true;
    try {
      const token = await refreshAccessToken();
      if (!token) throw new Error("No access token returned by refresh endpoint.");
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      setAccessToken(null);
      window.dispatchEvent(new CustomEvent("hcdf:session-expired"));
      return Promise.reject(refreshError);
    }
  }
);
