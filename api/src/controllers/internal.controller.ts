import type { Request, Response } from "express";

import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/respond";
import { expireReservationsOnce } from "../services/reservationExpiry.service";

export async function postExpireNow(req: Request, res: Response) {
  if (req.app.get("env") !== "development") {
    throw new ApiError({ statusCode: 404, code: "NOT_FOUND", message: "Not Found" });
  }

  const result = await expireReservationsOnce({ limit: 2000 });
  return sendSuccess(res, result, { requestId: res.locals.requestId });
}

