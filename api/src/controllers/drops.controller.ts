import type { Request, Response } from "express";

import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/respond";
import { createDrop, fetchLatestPurchasersByDropIds, listActiveDrops } from "../services/drops.service";
import { emitDropCreated, emitStockUpdated } from "../realtime/socket";

function computeEffectiveStatus(drop: any) {
  const status = String(drop?.status ?? "");
  if (status !== "scheduled") return status;

  const startsAt = drop?.startsAt ? new Date(drop.startsAt) : null;
  if (!startsAt || Number.isNaN(startsAt.getTime())) return status;

  return startsAt.getTime() <= Date.now() ? "live" : status;
}

function serializeDrop(drop: any) {
  return {
    id: drop.id,
    name: drop.name,
    price: drop.price,
    currency: drop.currency ?? "USD",
    total_stock: drop.totalStock,
    available_stock: drop.availableStock,
    starts_at: drop.startsAt ? new Date(drop.startsAt).toISOString() : null,
    ends_at: drop.endsAt ? new Date(drop.endsAt).toISOString() : null,
    status: computeEffectiveStatus(drop),
    created_by: drop.createdBy,
    created_at: drop.createdAt ? new Date(drop.createdAt).toISOString() : null
  };
}

export async function postDrop(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError({ statusCode: 401, code: "AUTH_REQUIRED", message: "X-User-Id header is required" });
  }
  const body = req.body as any;

  const drop = await createDrop({ ...body, created_by: userId });
  const data = serializeDrop(drop.get ? drop.get({ plain: true }) : drop);

  emitDropCreated({ drop: data });
  emitStockUpdated({ dropId: data.id, availableStock: data.available_stock });
  return sendSuccess(res, data, { requestId: res.locals.requestId }, 201);
}

export async function getDrops(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

  const { rows, count } = await listActiveDrops({ limit, offset });
  const dropPlain = rows.map((r) => (r.get ? r.get({ plain: true }) : r));
  const dropIds = dropPlain.map((d) => d.id);

  const latestPurchasersMap = await fetchLatestPurchasersByDropIds(dropIds);

  const items = dropPlain.map((d) => ({
    ...serializeDrop(d),
    activity_feed: {
      latest_purchasers: (latestPurchasersMap.get(d.id) ?? []).map((p) => ({
        user_id: p.user_id,
        username: p.username,
        qty: p.qty,
        created_at: new Date(p.created_at).toISOString()
      }))
    }
  }));

  return sendSuccess(
    res,
    {
      items,
      pagination: { limit, offset, total: count }
    },
    { requestId: res.locals.requestId }
  );
}
