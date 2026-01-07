import type { Request, Response } from "express";

import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/respond";
import { listMyActiveReservations, reserveOne } from "../services/reservations.service";
import { emitDropStockUpdated } from "../realtime/socket";

export async function postReserve(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, code: "AUTH_REQUIRED", message: "X-User-Id header is required" });
  }

  const dropId = req.params.dropId;
  const result = await reserveOne({ dropId, userId, ttlSeconds: 60 });

  emitDropStockUpdated({ dropId: result.drop.id, availableStock: result.drop.available_stock });
  return sendSuccess(res, result, { requestId: res.locals.requestId }, 201);
}

export async function getMyReservations(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, code: "AUTH_REQUIRED", message: "X-User-Id header is required" });
  }

  const rows = await listMyActiveReservations(userId);

  const data = rows.map((r: any) => ({
    id: r.id,
    drop_id: r.dropId,
    status: r.status,
    expires_at: r.expiresAt ? new Date(r.expiresAt).toISOString() : null,
    created_at: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    drop: r.drop
      ? {
          id: r.drop.id,
          name: r.drop.name,
          available_stock: r.drop.availableStock
        }
      : undefined
  }));

  return sendSuccess(res, { items: data }, { requestId: res.locals.requestId });
}
