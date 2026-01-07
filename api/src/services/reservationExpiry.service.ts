import { QueryTypes } from "sequelize";

import { getSequelize } from "../db/sequelize";

export type ExpireResult = {
  expiredCount: number;
  updatedDrops: Array<{ dropId: string; availableStock: number }>;
};

export async function expireReservationsOnce(params?: { limit?: number }) {
  const sequelize = getSequelize();
  const limit = params?.limit ?? 500;

  return sequelize.transaction(async (transaction) => {
    const expired = (await sequelize.query(
      `
        WITH expired AS (
          UPDATE reservations r
          SET status = 'expired', "updatedAt" = NOW()
          WHERE r.id IN (
            SELECT id
            FROM reservations
            WHERE status = 'active'
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
          (SELECT COALESCE(json_agg(json_build_object('dropId', id, 'availableStock', available_stock)), '[]'::json) FROM upd) AS updated_drops
      `,
      {
        transaction,
        replacements: { limit },
        type: QueryTypes.SELECT
      }
    )) as Array<{ expired_count: number; updated_drops: unknown }>;

    const row = expired[0] || { expired_count: 0, updated_drops: [] };
    const updatedDrops = Array.isArray(row.updated_drops) ? row.updated_drops : [];

    return {
      expiredCount: row.expired_count,
      updatedDrops: updatedDrops as Array<{ dropId: string; availableStock: number }>
    } satisfies ExpireResult;
  });
}
