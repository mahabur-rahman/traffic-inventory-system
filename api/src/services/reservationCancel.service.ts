import { QueryTypes } from "sequelize";

import { getSequelize } from "../db/sequelize";
import { ApiError } from "../utils/apiError";

export async function cancelReservation(params: { reservationId: string; userId: string }) {
  const sequelize = getSequelize();

  return sequelize.transaction(async (transaction) => {
    const rows = (await sequelize.query(
      `
        SELECT id, drop_id, user_id, status, expires_at
        FROM reservations
        WHERE id = :reservationId
          AND user_id = :userId
        FOR UPDATE
      `,
      {
        transaction,
        replacements: { reservationId: params.reservationId, userId: params.userId },
        type: QueryTypes.SELECT
      }
    )) as Array<{
      id: string;
      drop_id: string;
      user_id: string;
      status: string;
      expires_at: string | null;
    }>;

    if (!rows.length) {
      throw new ApiError({ statusCode: 404, code: "RESERVATION_NOT_FOUND", message: "Reservation not found" });
    }

    const reservation = rows[0];
    const now = new Date();
    const expiresAt = reservation.expires_at ? new Date(reservation.expires_at) : null;
    const isExpired = !expiresAt || expiresAt <= now;

    if (reservation.status !== "ACTIVE") {
      throw new ApiError({
        statusCode: 409,
        code: "RESERVATION_NOT_ACTIVE",
        message: "Reservation is not active"
      });
    }

    if (isExpired) {
      throw new ApiError({
        statusCode: 409,
        code: "RESERVATION_EXPIRED",
        message: "Reservation has expired"
      });
    }

    await sequelize.query(
      `
        UPDATE reservations
        SET status = 'CANCELLED', "updatedAt" = NOW()
        WHERE id = :reservationId
          AND status = 'ACTIVE'
      `,
      { transaction, replacements: { reservationId: reservation.id } }
    );

    const updated = (await sequelize.query(
      `
        UPDATE drops
        SET available_stock = LEAST(total_stock, available_stock + 1),
            updated_at = NOW()
        WHERE id = :dropId
        RETURNING id, available_stock
      `,
      {
        transaction,
        replacements: { dropId: reservation.drop_id },
        type: QueryTypes.SELECT
      }
    )) as Array<{ id: string; available_stock: number }>;

    return {
      reservationId: reservation.id,
      dropId: reservation.drop_id,
      status: "CANCELLED",
      availableStock: updated[0]?.available_stock ?? null
    };
  });
}

