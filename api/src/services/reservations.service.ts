import { Op, QueryTypes, UniqueConstraintError } from "sequelize";

import { getSequelize } from "../db/sequelize";
import { getModels } from "../models";
import { ApiError } from "../utils/apiError";
import { emitStockUpdated } from "../realtime/socket";

export type ReserveResult = {
  reservation: {
    id: string;
    drop_id: string;
    user_id: string;
    status: string;
    expires_at: string | null;
    created_at: string | null;
  };
  drop: {
    id: string;
    available_stock: number;
  };
};

export async function reserveOne(params: { dropId: string; userId: string; ttlSeconds?: number }) {
  const sequelize = getSequelize();
  const { Reservation } = getModels();

  const ttlSeconds = params.ttlSeconds ?? 60;

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const expiredRows = (await sequelize.query(
        `
          WITH expired AS (
            UPDATE reservations
            SET status = 'EXPIRED', "updatedAt" = NOW()
            WHERE user_id = :userId
              AND drop_id = :dropId
              AND status = 'ACTIVE'
              AND expires_at IS NOT NULL
              AND expires_at <= NOW()
            RETURNING id
          )
          SELECT COUNT(*)::int AS expired_count FROM expired
        `,
        {
          transaction,
          replacements: { userId: params.userId, dropId: params.dropId },
          type: QueryTypes.SELECT
        }
      )) as Array<{ expired_count: number }>;

      const expiredCount = expiredRows[0]?.expired_count ?? 0;
      if (expiredCount > 0) {
        await sequelize.query(
          `
            UPDATE drops
            SET available_stock = LEAST(total_stock, available_stock + :expiredCount),
                updated_at = NOW()
            WHERE id = :dropId
          `,
          { transaction, replacements: { dropId: params.dropId, expiredCount } }
        );
      }

      const updatedRows = (await sequelize.query(
        `
          UPDATE drops
          SET available_stock = available_stock - 1,
              status = CASE
                WHEN status = 'scheduled' AND (starts_at IS NULL OR starts_at <= NOW()) THEN 'live'
                ELSE status
              END,
              updated_at = NOW()
          WHERE id = :dropId
            AND available_stock > 0
            AND status IN ('live', 'scheduled')
            AND (starts_at IS NULL OR starts_at <= NOW())
            AND (ends_at IS NULL OR ends_at > NOW())
          RETURNING id, available_stock
        `,
        { transaction, replacements: { dropId: params.dropId }, type: QueryTypes.SELECT }
      )) as Array<{ id: string; available_stock: number }>;

      if (updatedRows.length === 0) {
        const dropRow = (await sequelize.query(
          `SELECT id, status, available_stock, starts_at, ends_at FROM drops WHERE id = :dropId`,
          { transaction, replacements: { dropId: params.dropId }, type: QueryTypes.SELECT }
        )) as Array<{
          id: string;
          status: string;
          available_stock: number;
          starts_at: string | null;
          ends_at: string | null;
        }>;

        if (!dropRow.length) {
          return {
            ok: false as const,
            error: { statusCode: 404, code: "DROP_NOT_FOUND", message: "Drop not found" },
            effects: null
          };
        }

        const d = dropRow[0];
        const now = new Date();
        const startsAtOk = !d.starts_at || new Date(d.starts_at) <= now;
        const endsAtOk = !d.ends_at || new Date(d.ends_at) > now;

        if (!startsAtOk || !endsAtOk || d.status !== "live") {
          return {
            ok: false as const,
            error: { statusCode: 409, code: "DROP_NOT_ACTIVE", message: "Drop is not active" },
            effects:
              expiredCount > 0
                ? { stockUpdated: { dropId: d.id, availableStock: Number(d.available_stock) } }
                : null
          };
        }
        if (Number(d.available_stock) <= 0) {
          return {
            ok: false as const,
            error: { statusCode: 409, code: "OUT_OF_STOCK", message: "Drop is out of stock" },
            effects:
              expiredCount > 0
                ? { stockUpdated: { dropId: d.id, availableStock: Number(d.available_stock) } }
                : null
          };
        }

        return {
          ok: false as const,
          error: {
            statusCode: 409,
            code: "CONFLICT",
            message: "Unable to reserve due to concurrent conflict"
          },
          effects:
            expiredCount > 0 ? { stockUpdated: { dropId: d.id, availableStock: Number(d.available_stock) } } : null
        };
      }

      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      const reservation = await (Reservation as any).create(
        {
          userId: params.userId,
          dropId: params.dropId,
          status: "ACTIVE",
          expiresAt
        },
        { transaction }
      );

      const plain = reservation.get ? reservation.get({ plain: true }) : reservation;

      return {
        ok: true as const,
        value: {
          reservation: {
            id: plain.id,
            drop_id: plain.dropId,
            user_id: plain.userId,
            status: plain.status,
            expires_at: plain.expiresAt ? new Date(plain.expiresAt).toISOString() : null,
            created_at: plain.createdAt ? new Date(plain.createdAt).toISOString() : null
          },
          drop: {
            id: updatedRows[0].id,
            available_stock: updatedRows[0].available_stock
          }
        } satisfies ReserveResult
      };
    });

    if (!result.ok) {
      if (result.effects?.stockUpdated) {
        emitStockUpdated(result.effects.stockUpdated);
      }
      throw new ApiError(result.error);
    }

    return result.value;
  } catch (err: any) {
    if (err instanceof UniqueConstraintError) {
      throw new ApiError({
        statusCode: 409,
        code: "ALREADY_RESERVED",
        message: "You already have an active reservation for this drop"
      });
    }
    throw err;
  }
}

export async function listMyActiveReservations(userId: string) {
  const { Reservation, Drop } = getModels();
  const now = new Date();

  const rows = await (Reservation as any).findAll({
    where: { userId, status: "ACTIVE", expiresAt: { [Op.gt]: now } },
    include: [{ model: Drop, as: "drop" }],
    order: [["expiresAt", "ASC"]]
  });

  return rows.map((r: any) => (r.get ? r.get({ plain: true }) : r));
}
