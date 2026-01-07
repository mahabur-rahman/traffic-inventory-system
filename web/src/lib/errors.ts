import { ApiError } from "../types/api";

export type NormalizedError = {
  title: string;
  message: string;
  code: string;
  requestId?: string;
};

export function normalizeError(err: unknown): NormalizedError {
  if (err instanceof ApiError) {
    const title = err.code
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
