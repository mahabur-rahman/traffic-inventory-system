import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";

  if (req.app.get("env") === "development") {
    return res.status(status).json({ ok: false, message, stack: err?.stack });
  }

  return res.status(status).json({ ok: false, message });
}

