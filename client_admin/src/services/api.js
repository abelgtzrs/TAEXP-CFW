// src/services/api.js
import axios from "axios";

// Safe resolution of API base URL so running this file directly with Node (where import.meta.env is undefined)
// does not throw. Prefer Vite env, then process.env, then default localhost.
const resolveApiBase = () => {
  // import.meta is always defined in ESM; env may be undefined outside Vite
  const viteBase = import.meta?.env?.VITE_API_BASE_URL;
  const procBase = typeof process !== "undefined" ? process.env?.VITE_API_BASE_URL : undefined;
  const raw = viteBase || procBase || "http://localhost:5000/api";
  // If user already ended with /api, keep; else append /api
  if (/\/api\/?$/.test(raw)) return raw.replace(/\/$/, "");
  return raw.replace(/\/$/, "") + "/api";
};

// Create an Axios instance with a base URL.
// The VITE_API_BASE_URL should be in your .env.local file.
// Example: VITE_API_BASE_URL=http://localhost:5000/api
const api = axios.create({
  baseURL: resolveApiBase(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional one-time debug (won't break in Node) – comment out if noisy
if (typeof console !== "undefined") {
  // eslint-disable-next-line no-console
  console.debug("client_admin api base:", api.defaults.baseURL);
}

// Axios Request Interceptor: This function runs BEFORE each request is sent.
// It's the perfect place to automatically add the JWT to the authorization header.
api.interceptors.request.use(
  (config) => {
    // Get the token from localStorage (or wherever you store it).
    const token = localStorage.getItem("token");
    if (token) {
      // If the token exists, add it to the 'Authorization' header.
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config; // Return the modified config.
  },
  (error) => {
    // Handle request errors.
    return Promise.reject(error);
  },
);

export const createPlaidLinkToken = async () => {
  const response = await api.post("/finance/plaid/create-link-token");
  return response.data;
};

export const exchangePlaidPublicToken = async (publicToken) => {
  const response = await api.post("/finance/plaid/exchange-public-token", { publicToken });
  return response.data;
};

export default api;
