import type { Request, Response } from "express";

import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/respond";
import { purchaseDrop } from "../services/purchases.service";

export async function postPurchase(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, code: "AUTH_REQUIRED", message: "X-User-Id header is required" });
  }

  const dropId = req.params.dropId;
  const result = await purchaseDrop({ dropId, userId });

  // Note: drop stock is NOT decremented here; it was decremented at reserve time.
  return sendSuccess(res, result, { requestId: res.locals.requestId }, 201);
}

