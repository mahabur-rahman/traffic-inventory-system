import { API_BASE_URL } from "./env";
import { getAuth } from "./auth";
import { ApiError, type ApiEnvelope, type ApiMeta } from "../types/api";

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<{ data: T; meta?: ApiMeta }> {
  const auth = init?.auth ?? true;
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const a = getAuth();
    if (a?.userId) {
      headers.set("X-User-Id", a.userId);
      headers.set("X-User-Name", a.username);
    }
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError({ code: "NETWORK_ERROR", status: 0, message: "Network error. Is the API running?" });
  }
  const text = await res.text();
  const json = text ? safeJsonParse(text) : null;

  if (!json || typeof json !== "object") {
    if (!res.ok) {
      throw new ApiError({ code: "HTTP_ERROR", status: res.status, message: `Request failed (${res.status})` });
    }
    return { data: json as T };
  }

  const envelope = json as ApiEnvelope<T>;
  if ("success" in envelope && envelope.success === true) {
    return { data: envelope.data, meta: envelope.meta };
  }

  if ("success" in envelope && envelope.success === false) {
    throw new ApiError({
      code: envelope.error.code,
      status: res.status,
      message: envelope.error.message,
      requestId: envelope.meta?.requestId
    });
  }

  if (!res.ok) {
    throw new ApiError({ code: "HTTP_ERROR", status: res.status, message: `Request failed (${res.status})` });
  }

  return { data: json as T };
}
