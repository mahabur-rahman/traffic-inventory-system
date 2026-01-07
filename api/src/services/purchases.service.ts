import { QueryTypes, UniqueConstraintError } from "sequelize";

import { getSequelize } from "../db/sequelize";
import { getModels } from "../models";
import { ApiError } from "../utils/apiError";

export type PurchaseResult = {
  purchase: {
    id: string;
    drop_id: string;
    user_id: string;
    qty: number;
    status: string;
    created_at: string | null;
  };
  reservation: {
    id: string;
    status: string;
    expires_at: string | null;
  };
};

export async function purchaseDrop(params: { dropId: string; userId: string }) {
  const sequelize = getSequelize();
  const { Purchase } = getModels();

  try {
    return await sequelize.transaction(async (transaction) => {
      const reservationRows = (await sequelize.query(
        `
          SELECT id, status, expires_at
          FROM reservations
          WHERE user_id = :userId
            AND drop_id = :dropId
          ORDER BY "createdAt" DESC
          LIMIT 1
          FOR UPDATE
        `,
        { transaction, replacements: { userId: params.userId, dropId: params.dropId }, type: QueryTypes.SELECT }
      )) as Array<{ id: string; status: string; expires_at: string | null }>;

      if (reservationRows.length === 0) {
        throw new ApiError({
          statusCode: 409,
          code: "RESERVATION_REQUIRED",
          message: "Active reservation is required before purchase"
        });
      }

      const reservation = reservationRows[0];
      const now = new Date();
      const expiresAt = reservation.expires_at ? new Date(reservation.expires_at) : null;
      const isExpired = !expiresAt || expiresAt <= now;

      if (reservation.status !== "active") {
        throw new ApiError({
          statusCode: 409,
          code: "RESERVATION_NOT_ACTIVE",
          message: "Reservation is not active"
        });
      }

      if (isExpired) {
        const expiredRows = (await sequelize.query(
          `
            UPDATE reservations
            SET status = 'expired', "updatedAt" = NOW()
            WHERE id = :reservationId
              AND status = 'active'
            RETURNING id
          `,
          { transaction, replacements: { reservationId: reservation.id }, type: QueryTypes.SELECT }
        )) as Array<{ id: string }>;

        if (expiredRows.length) {
          await sequelize.query(
            `
              UPDATE drops
              SET available_stock = LEAST(total_stock, available_stock + 1),
                  updated_at = NOW()
              WHERE id = :dropId
            `,
            { transaction, replacements: { dropId: params.dropId } }
          );
        }

        throw new ApiError({
          statusCode: 409,
          code: "RESERVATION_EXPIRED",
          message: "Reservation has expired"
        });
      }

      const consumedRows = (await sequelize.query(
        `
          UPDATE reservations
          SET status = 'consumed', "updatedAt" = NOW()
          WHERE id = :reservationId
            AND status = 'active'
          RETURNING id
        `,
        { transaction, replacements: { reservationId: reservation.id }, type: QueryTypes.SELECT }
      )) as Array<{ id: string }>;

      if (consumedRows.length === 0) {
        throw new ApiError({
          statusCode: 409,
          code: "RESERVATION_CONFLICT",
          message: "Reservation could not be consumed (concurrent update)"
        });
      }

      const dropRows = (await sequelize.query(
        `SELECT id, price, currency FROM drops WHERE id = :dropId`,
        { transaction, replacements: { dropId: params.dropId }, type: QueryTypes.SELECT }
      )) as Array<{ id: string; price: number; currency: string }>;

      if (!dropRows.length) {
        throw new ApiError({ statusCode: 404, code: "DROP_NOT_FOUND", message: "Drop not found" });
      }

      const drop = dropRows[0];
      const qty = 1;
      const amountCents = Number(drop.price) * qty;

      const purchase = await (Purchase as any).create(
        {
          userId: params.userId,
          dropId: params.dropId,
          reservationId: reservation.id,
          qty,
          amountCents,
          currency: drop.currency || "USD",
          status: "paid",
          provider: "manual"
        },
        { transaction }
      );

      const plain = purchase.get ? purchase.get({ plain: true }) : purchase;

      return {
        purchase: {
          id: plain.id,
          drop_id: plain.dropId,
          user_id: plain.userId,
          qty: plain.qty,
          status: plain.status,
          created_at: plain.createdAt ? new Date(plain.createdAt).toISOString() : null
        },
        reservation: {
          id: reservation.id,
          status: "consumed",
          expires_at: expiresAt ? expiresAt.toISOString() : null
        }
      } satisfies PurchaseResult;
    });
  } catch (err: any) {
    if (err instanceof UniqueConstraintError) {
      throw new ApiError({
        statusCode: 409,
        code: "ALREADY_PURCHASED",
        message: "Reservation has already been purchased"
      });
    }
    throw err;
  }
}

