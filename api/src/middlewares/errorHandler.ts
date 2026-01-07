import type { NextFunction, Request, Response } from "express";

import { ApiError } from "../utils/apiError";
import { sendError } from "../utils/respond";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 500;
  const code =
    typeof err?.code === "string"
      ? err.code
      : err instanceof ApiError
        ? err.code
        : statusCode === 404
          ? "NOT_FOUND"
          : "INTERNAL_ERROR";
  const message = typeof err?.message === "string" ? err.message : "Internal Server Error";

  const details =
    err instanceof ApiError
      ? err.details
      : req.app.get("env") === "development"
        ? { stack: err?.stack, raw: err instanceof Error ? undefined : err }
        : undefined;

  return sendError(res, {
    statusCode,
    code,
    message,
    details,
    meta: { requestId: res.locals.requestId }
  });
}
