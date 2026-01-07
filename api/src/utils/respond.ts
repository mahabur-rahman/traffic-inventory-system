import type { Response } from "express";

export type ApiMeta = {
  requestId?: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiFailure = {
  success: false;
  error: ApiErrorBody;
  meta?: ApiMeta;
};

export function sendSuccess<T>(res: Response, data: T, meta?: ApiMeta, statusCode = 200) {
  const payload: ApiSuccess<T> = meta ? { success: true, data, meta } : { success: true, data };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  params: { statusCode: number; code: string; message: string; details?: unknown; meta?: ApiMeta }
) {
  const payload: ApiFailure = {
    success: false,
    error: { code: params.code, message: params.message, details: params.details },
    meta: params.meta
  };

  if (!payload.meta) delete (payload as any).meta;
  if (payload.error.details === undefined) delete (payload.error as any).details;

  return res.status(params.statusCode).json(payload);
}

