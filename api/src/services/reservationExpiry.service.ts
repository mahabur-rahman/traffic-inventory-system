import { QueryTypes } from "sequelize";

import { getSequelize } from "../db/sequelize";
import { logger } from "../logger";

export type ExpireResult = {
  expiredCount: number;
  updatedDrops: Array<{ dropId: string; availableStock: number }>;
  expiredReservations: Array<{ reservationId: string; dropId: string }>;
};

let schemaReadyCache: boolean | null = null;
let warnedMissingSchema = false;

async function isSchemaReady() {
  if (schemaReadyCache === true) return true;

  const sequelize = getSequelize();
  const rows = (await sequelize.query(
    `SELECT to_regclass('public.reservations') AS reservations, to_regclass('public.drops') AS drops`,
    { type: QueryTypes.SELECT }
  )) as Array<{ reservations: string | null; drops: string | null }>;

  const ready = Boolean(rows[0]?.reservations) && Boolean(rows[0]?.drops);
  if (ready) schemaReadyCache = true;

  return ready;
}

export async function expireReservationsOnce(params?: { limit?: number }) {
  const sequelize = getSequelize();
  const limit = params?.limit ?? 500;

  const ready = await isSchemaReady();
  if (!ready) {
    if (!warnedMissingSchema) {
      warnedMissingSchema = true;
      logger.warn("DB schema not ready (missing tables). Run `npm run db:migrate`.");
    }
    return { expiredCount: 0, updatedDrops: [], expiredReservations: [] };
  }

  return sequelize.transaction(async (transaction) => {
    const expired = (await sequelize.query(
      `
        WITH expired AS (
          UPDATE reservations r
          SET status = 'EXPIRED', "updatedAt" = NOW()
          WHERE r.id IN (
            SELECT id
            FROM reservations
            WHERE status = 'ACTIVE'
              AND expires_at IS NOT NULL
              AND expires_at <= NOW()
            ORDER BY expires_at ASC
            LIMIT :limit
            FOR UPDATE SKIP LOCKED
          )
          RETURNING r.id, r.drop_id
        ),
        agg AS (
          SELECT drop_id, COUNT(*)::int AS qty
          FROM expired
          GROUP BY drop_id
        ),
        upd AS (
          UPDATE drops d
          SET available_stock = LEAST(d.total_stock, d.available_stock + agg.qty),
              updated_at = NOW()
          FROM agg
          WHERE d.id = agg.drop_id
          RETURNING d.id, d.available_stock
        )
        SELECT
          (SELECT COUNT(*)::int FROM expired) AS expired_count,
          (SELECT COALESCE(json_agg(json_build_object('dropId', id, 'availableStock', available_stock)), '[]'::json) FROM upd) AS updated_drops,
          (SELECT COALESCE(json_agg(json_build_object('reservationId', id, 'dropId', drop_id)), '[]'::json) FROM expired) AS expired_reservations
      `,
      {
        transaction,
        replacements: { limit },
        type: QueryTypes.SELECT
      }
    )) as Array<{ expired_count: number; updated_drops: unknown; expired_reservations: unknown }>;

    const row = expired[0] || { expired_count: 0, updated_drops: [] };
    const updatedDrops = Array.isArray(row.updated_drops) ? row.updated_drops : [];
    const expiredReservations = Array.isArray((row as any).expired_reservations)
      ? (row as any).expired_reservations
      : [];

    return {
      expiredCount: row.expired_count,
      updatedDrops: updatedDrops as Array<{ dropId: string; availableStock: number }>,
      expiredReservations: expiredReservations as Array<{ reservationId: string; dropId: string }>
    } satisfies ExpireResult;
  });
}
