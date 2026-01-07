import type { NextFunction, Request, Response } from "express";
import {
  ConnectionError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError
} from "sequelize";

import { ApiError } from "../utils/apiError";
import { sendError } from "../utils/respond";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof UniqueConstraintError) {
    apiError = new ApiError({
      statusCode: 409,
      code: "CONFLICT",
      message: "Conflict",
      details: err.errors?.map((e) => ({ message: e.message, path: e.path, value: e.value }))
    });
  } else if (err instanceof ForeignKeyConstraintError) {
    apiError = new ApiError({
      statusCode: 409,
      code: "CONFLICT",
      message: "Conflict",
      details: { table: err.table, fields: err.fields }
    });
  } else if (err instanceof ValidationError) {
    apiError = new ApiError({
      statusCode: 422,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: err.errors?.map((e) => ({ message: e.message, path: e.path, value: e.value }))
    });
  } else if (err instanceof ConnectionError) {
    apiError = new ApiError({
      statusCode: 503,
      code: "DB_UNAVAILABLE",
      message: "Database unavailable"
    });
  } else if (err instanceof AggregateError) {
    apiError = new ApiError({
      statusCode: 500,
      code: "CONCURRENCY_ERROR",
      message: "Concurrent operation failed",
      details: req.app.get("env") === "development" ? err.errors : undefined
    });
  } else {
    const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 500;
    const code = typeof err?.code === "string" ? err.code : "INTERNAL_ERROR";
    const message = typeof err?.message === "string" ? err.message : "Internal Server Error";
    apiError = new ApiError({
      statusCode,
      code,
      message,
      details:
        req.app.get("env") === "development"
          ? { stack: err?.stack, raw: err instanceof Error ? undefined : err }
          : undefined
    });
  }

  return sendError(res, {
    statusCode: apiError.statusCode,
    code: apiError.code,
    message: apiError.message,
    details: apiError.details,
    meta: { requestId: res.locals.requestId }
  });
}
