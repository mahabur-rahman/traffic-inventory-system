import axios from "axios";

import { API_URL } from "../lib/env";
import { getAuth } from "../lib/auth";
import { store } from "../store/store";
import type { ApiEnvelope } from "../types/api";
import { toApiError } from "./errors";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20_000
});

api.interceptors.request.use((config) => {
  const session = store.getState().session;
  const fallback = getAuth();

  const userId = session.userId ?? fallback?.userId ?? null;
  const username = session.username ?? fallback?.username ?? null;

  if (userId) {
    config.headers = config.headers ?? {};
    (config.headers as any)["X-User-Id"] = userId;
    if (username) (config.headers as any)["X-User-Name"] = username;
  }

  return config;
});

export async function apiGet<T>(path: string): Promise<T> {
  try {
    const res = await api.get<ApiEnvelope<T>>(path);
    const envelope = res.data as ApiEnvelope<T>;
    if (envelope.success) return envelope.data;
    throw toApiError({ response: { status: 400, data: envelope } } as any);
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiPost<T>(path: string): Promise<T> {
  try {
    const res = await api.post<ApiEnvelope<T>>(path);
    const envelope = res.data as ApiEnvelope<T>;
    if (envelope.success) return envelope.data;
    throw toApiError({ response: { status: 400, data: envelope } } as any);
  } catch (err) {
    throw toApiError(err);
  }
}

