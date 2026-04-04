import axios from "axios";

export const resolvePublicApiBase = () => {
  const envBase = (import.meta?.env?.VITE_PUBLIC_API_BASE_URL || import.meta?.env?.VITE_API_BASE_URL || "").trim();

  if (envBase) {
    try {
      const u = new URL(envBase, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      const path = u.pathname.replace(/\/$/, "");
      if (path.endsWith("/api")) {
        u.pathname = `${path}/public`;
      }
      return u.toString();
    } catch {
      return envBase;
    }
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    if (/netlify\.app$/i.test(window.location.hostname)) {
      return "https://taexp3-0.onrender.com/api/public";
    }
    if (window.location.hostname === "localhost") {
      return "http://localhost:5000/api/public";
    }
    return `${origin}/api/public`;
  }

  return "/api/public";
};

export const terminalApi = axios.create({
  baseURL: resolvePublicApiBase(),
  headers: { "Content-Type": "application/json" },
});

if (typeof window !== "undefined") {
  console.debug("Terminal API base:", terminalApi.defaults.baseURL);
}
