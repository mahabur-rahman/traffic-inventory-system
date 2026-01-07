import { ApiError } from "../types/api";

export type NormalizedError = {
  title: string;
  message: string;
  code: string;
  requestId?: string;
};

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof ApiError) {
    const titleMap: Record<string, string> = {
      OUT_OF_STOCK: "Out of stock",
      DROP_NOT_ACTIVE: "Drop not active",
      ALREADY_RESERVED: "Already reserved",
      RESERVATION_REQUIRED: "Reservation required",
      RESERVATION_EXPIRED: "Reservation expired",
      VALIDATION_ERROR: "Validation error",
      AUTH_REQUIRED: "Auth required",
      CONFLICT: "Conflict"
    };

    const title =
      titleMap[err.code] ||
      err.code
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/(^|\s)\S/g, (t) => t.toUpperCase());
    return { title, message: err.message, code: err.code, requestId: err.requestId };
  }

  if (err instanceof Error) {
    return { title: "Error", message: err.message, code: "UNKNOWN_ERROR" };
  }

  return { title: "Error", message: "Something went wrong", code: "UNKNOWN_ERROR" };
}
