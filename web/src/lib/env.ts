function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const API_ORIGIN = stripTrailingSlash(import.meta.env.VITE_API_URL ?? "http://localhost:4000");
export const API_BASE_URL = `${API_ORIGIN}/api`;
