import type { NextFunction, Request, RequestHandler, Response } from "express";
import crypto from "node:crypto";

import { UniqueConstraintError } from "sequelize";
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
      return next();
    }

    if ((process.env.NODE_ENV || "development") === "development") {
      const providedName = req.header("x-user-name")?.trim();
      const base =
        providedName && providedName.length >= 3
          ? providedName
          : `user_${parsed.data.replace(/-/g, "").slice(0, 12)}`;

      let username = base.slice(0, 50);
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const created = await (User as any).create({ id: parsed.data, username });
          const createdUsername = created.get("username") as string;
          req.user = { id: parsed.data, username: createdUsername };
          break;
        } catch (err) {
          if (err instanceof UniqueConstraintError) {
            username = `${base.slice(0, 40)}_${crypto.randomBytes(3).toString("hex")}`;
            continue;
          }
          throw err;
        }
      }
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
