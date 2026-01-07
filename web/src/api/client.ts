import { apiRequest } from "../lib/api";

export async function get<T>(path: string) {
  const res = await apiRequest<T>(path, { method: "GET" });
  return res.data;
}

export async function post<T>(path: string) {
  const res = await apiRequest<T>(path, { method: "POST" });
  return res.data;
}

