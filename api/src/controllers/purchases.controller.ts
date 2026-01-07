import type { Request, Response } from "express";

import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/respond";
import { purchaseDrop } from "../services/purchases.service";
import { emitActivityUpdated, emitPurchaseCompleted } from "../realtime/socket";
import { fetchLatestPurchasersByDropIds } from "../services/drops.service";

export async function postPurchase(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, code: "AUTH_REQUIRED", message: "X-User-Id header is required" });
  }

  const dropId = req.params.dropId;
  const result = await purchaseDrop({ dropId, userId });

  const latest = await fetchLatestPurchasersByDropIds([dropId]);
  const list = latest.get(dropId) ?? [];
  emitActivityUpdated({
    dropId,
    latestPurchasers: list.map((p) => ({
      userId: p.user_id,
      username: p.username,
      qty: p.qty,
      createdAt: new Date(p.created_at).toISOString()
    }))
  });

  const mine = list.find((p) => p.user_id === userId);
  emitPurchaseCompleted({
    dropId,
    username: mine?.username ?? req.user?.username ?? null,
    purchasedAt: result.purchase.created_at || new Date().toISOString()
  });

  // Note: drop stock is NOT decremented here; it was decremented at reserve time.
  return sendSuccess(res, result, { requestId: res.locals.requestId }, 201);
}
