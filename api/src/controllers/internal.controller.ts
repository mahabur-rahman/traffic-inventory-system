import type { Request, Response } from "express";

import { UniqueConstraintError } from "sequelize";

import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/respond";
import { expireReservationsOnce } from "../services/reservationExpiry.service";
import { getModels } from "../models";

export async function postExpireNow(req: Request, res: Response) {
  if (req.app.get("env") !== "development") {
    throw new ApiError({ statusCode: 404, code: "NOT_FOUND", message: "Not Found" });
  }

  const result = await expireReservationsOnce({ limit: 2000 });
  return sendSuccess(res, result, { requestId: res.locals.requestId });
}

export async function postCreateUser(req: Request, res: Response) {
  if (req.app.get("env") !== "development") {
    throw new ApiError({ statusCode: 404, code: "NOT_FOUND", message: "Not Found" });
  }

  const { User } = getModels();
  const { username } = req.body as { username: string };

  try {
    const user = await (User as any).create({ username });
    const plain = user.get ? user.get({ plain: true }) : user;
    return sendSuccess(
      res,
      { id: plain.id, username: plain.username },
      { requestId: res.locals.requestId },
      201
    );
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new ApiError({
        statusCode: 409,
        code: "USERNAME_TAKEN",
        message: "Username already exists"
      });
    }
    throw err;
  }
}
