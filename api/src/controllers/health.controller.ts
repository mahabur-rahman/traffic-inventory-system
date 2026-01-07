import type { Request, Response } from "express";

import { getSequelize } from "../db/sequelize";
import { sendSuccess } from "../utils/respond";

export async function health(req: Request, res: Response) {
  let db: "up" | "down" | "not_configured" = "down";
  try {
    const sequelize = getSequelize();
    await sequelize.authenticate();
    db = "up";
  } catch (err: any) {
    db = err?.code === "DB_NOT_CONFIGURED" ? "not_configured" : "down";
  }

  return sendSuccess(
    res,
    { service: "api", uptime: process.uptime(), db },
    { requestId: res.locals.requestId }
  );
}
