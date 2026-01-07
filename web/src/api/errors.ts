import type { AxiosError } from "axios";

import { ApiError, type ApiEnvelope } from "../types/api";

export type UiErrorCode =
  | "OUT_OF_STOCK"
  | "CONFLICT"
  | "DROP_NOT_ACTIVE"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export function normalizeUiErrorCode(code: string): UiErrorCode {
  if (code === "OUT_OF_STOCK") return "OUT_OF_STOCK";
  if (code === "DROP_NOT_ACTIVE") return "DROP_NOT_ACTIVE";
  if (code === "VALIDATION_ERROR") return "VALIDATION_ERROR";
  if (code === "AUTH_REQUIRED") return "UNAUTHORIZED";
  if (code === "INVALID_X_USER_ID") return "UNAUTHORIZED";
  if (code === "CONFLICT") return "CONFLICT";
  if (code === "ALREADY_RESERVED") return "CONFLICT";
  if (code === "RESERVATION_CONFLICT") return "CONFLICT";
  if (code === "NETWORK_ERROR") return "NETWORK_ERROR";
  return "UNKNOWN_ERROR";
}

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return Boolean(value && typeof value === "object" && "success" in (value as any));
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  const ax = err as AxiosError | undefined;
  const status = ax?.response?.status ?? 0;
  const data = ax?.response?.data;

  if (!ax?.response) {
    return new ApiError({ code: "NETWORK_ERROR", status: 0, message: "Network error. Is the API running?" });
  }

  if (isEnvelope(data) && data.success === false) {
    return new ApiError({
      code: data.error.code,
      status,
      message: data.error.message,
      requestId: data.meta?.requestId
    });
  }

  return new ApiError({
    code: "HTTP_ERROR",
    status,
    message: `Request failed (${status})`
  });
}
