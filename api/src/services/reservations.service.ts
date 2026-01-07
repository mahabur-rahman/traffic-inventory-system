import { Op, QueryTypes, UniqueConstraintError } from "sequelize";

import { getSequelize } from "../db/sequelize";
import { getModels } from "../models";
import { ApiError } from "../utils/apiError";

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
    return await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        `
          UPDATE reservations
          SET status = 'expired', "updatedAt" = NOW()
          WHERE user_id = :userId
            AND drop_id = :dropId
            AND status = 'active'
            AND expires_at IS NOT NULL
            AND expires_at <= NOW()
        `,
        { transaction, replacements: { userId: params.userId, dropId: params.dropId } }
      );

      const updatedRows = (await sequelize.query(
        `
          UPDATE drops
          SET available_stock = available_stock - 1, updated_at = NOW()
          WHERE id = :dropId
            AND available_stock > 0
            AND status IN ('live')
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
          throw new ApiError({ statusCode: 404, code: "DROP_NOT_FOUND", message: "Drop not found" });
        }

        const d = dropRow[0];
        const now = new Date();
        const startsAtOk = !d.starts_at || new Date(d.starts_at) <= now;
        const endsAtOk = !d.ends_at || new Date(d.ends_at) > now;

        if (!startsAtOk || !endsAtOk || d.status !== "live") {
          throw new ApiError({
            statusCode: 409,
            code: "DROP_NOT_ACTIVE",
            message: "Drop is not active"
          });
        }
        if (Number(d.available_stock) <= 0) {
          throw new ApiError({
            statusCode: 409,
            code: "OUT_OF_STOCK",
            message: "Drop is out of stock"
          });
        }

        throw new ApiError({
          statusCode: 409,
          code: "OUT_OF_STOCK",
          message: "Unable to reserve due to concurrent conflict"
        });
      }

      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      const reservation = await (Reservation as any).create(
        {
          userId: params.userId,
          dropId: params.dropId,
          status: "active",
          expiresAt
        },
        { transaction }
      );

      const plain = reservation.get ? reservation.get({ plain: true }) : reservation;

      return {
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
      } satisfies ReserveResult;
    });
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
    where: { userId, status: "active", expiresAt: { [Op.gt]: now } },
    include: [{ model: Drop, as: "drop" }],
    order: [["expiresAt", "ASC"]]
  });

  return rows.map((r: any) => (r.get ? r.get({ plain: true }) : r));
}
