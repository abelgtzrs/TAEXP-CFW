import Constants from "expo-constants";
import axios, { AxiosError } from "axios";

import { getAuthToken } from "@/services/storage/secureStorage";

type ErrorEnvelope = {
  message?: string;
};

export type ApiError = {
  status?: number;
  message: string;
  data?: unknown;
};

type UnauthorizedHandler = (() => Promise<void> | void) | null;

let unauthorizedHandler: UnauthorizedHandler = null;

function getRawApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  const fromAppConfig = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;

  return fromEnv || fromAppConfig || "http://localhost:5000/api";
}

export function resolveApiBaseUrl() {
  const raw = getRawApiBaseUrl().trim();
  if (/\/api\/?$/i.test(raw)) {
    return raw.replace(/\/$/, "");
  }
  return `${raw.replace(/\/$/, "")}/api`;
}

export function resolvePublicBaseUrl() {
  return resolveApiBaseUrl().replace(/\/api\/?$/i, "");
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorEnvelope>) => {
    const normalized: ApiError = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message || "Unexpected network error",
      data: error.response?.data
    };

    if (error.response?.status === 401 && unauthorizedHandler) {
      await unauthorizedHandler();
    }

    return Promise.reject(normalized);
  },
);

export default apiClient;