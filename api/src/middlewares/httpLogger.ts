import crypto from "node:crypto";

import pinoHttp from "pino-http";
import type { RequestHandler } from "express";

import { logger } from "../logger";

export const httpLogger: RequestHandler = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const header = req.headers["x-request-id"];
    const incoming = Array.isArray(header) ? header[0] : header;
    const id = incoming && String(incoming).trim() ? String(incoming).trim() : crypto.randomUUID();
    res.setHeader("x-request-id", id);
    return id;
  },
  customProps: (req, res) => ({
    requestId: (req as any).id,
    userId: req.headers["x-user-id"]
  })
}) as unknown as RequestHandler;
