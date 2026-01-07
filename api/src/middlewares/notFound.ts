import type { Request, Response } from "express";

import { sendError } from "../utils/respond";

export function notFound(req: Request, res: Response) {
  return sendError(res, {
    statusCode: 404,
    code: "NOT_FOUND",
    message: "Not Found",
    meta: { requestId: res.locals.requestId }
  });
}
