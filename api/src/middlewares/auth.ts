import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";

import { ApiError } from "../utils/apiError";
import { getModels } from "../models";

const userIdSchema = z.string().uuid();

export const loadUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const raw = req.header("x-user-id");
  if (!raw) {
    req.user = null;
    return next();
  }

  const parsed = userIdSchema.safeParse(raw.trim());
  if (!parsed.success) {
    return next(
      new ApiError({
        statusCode: 400,
        code: "INVALID_X_USER_ID",
        message: "Invalid X-User-Id header (expected UUID)"
      })
    );
  }

  req.user = { id: parsed.data };

  try {
    const { User } = getModels();
    const record = await User.findByPk(parsed.data);
    if (record) {
      const username = record.get("username") as string | null | undefined;
      req.user = { id: parsed.data, username: username ?? null };
    }
  } catch {
    // Placeholder auth: ignore DB lookup failures (e.g., migrations not run yet).
  }

  return next();
};

export function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(
      new ApiError({
        statusCode: 401,
        code: "AUTH_REQUIRED",
        message: "X-User-Id header is required"
      })
    );
  }
  return next();
}
