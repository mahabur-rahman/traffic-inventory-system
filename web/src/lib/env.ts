function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const RAW_API_URL = stripTrailingSlash(import.meta.env.VITE_API_URL ?? "http://localhost:4000");

export const API_BASE_URL = RAW_API_URL.endsWith("/api") ? RAW_API_URL : `${RAW_API_URL}/api`;
export const API_ORIGIN = RAW_API_URL.endsWith("/api") ? RAW_API_URL.slice(0, -4) : RAW_API_URL;

export const SOCKET_ORIGIN = stripTrailingSlash(import.meta.env.VITE_SOCKET_URL ?? API_ORIGIN);
