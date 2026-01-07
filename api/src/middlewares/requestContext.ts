import type { RequestHandler } from "express";
import crypto from "node:crypto";

export const requestContext: RequestHandler = (req, res, next) => {
  const reqId = (req as any).id || res.getHeader("x-request-id");
  const id = (typeof reqId === "string" && reqId.trim()) || crypto.randomUUID();
  res.locals.requestId = id;
  if (!res.getHeader("x-request-id")) res.setHeader("x-request-id", id);
  next();
};
