import { Router } from "express";

import { requireUser } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteCancelReservation, getMyReservations, postReserve } from "../controllers/reservations.controller";
import { cancelReservationParamsSchema, reserveParamsSchema } from "../validators/reservation.schemas";

const router = Router();

router.post(
  "/drops/:dropId/reserve",
  requireUser,
  validate({ params: reserveParamsSchema }),
  asyncHandler(postReserve)
);

router.get("/reservations/me", requireUser, asyncHandler(getMyReservations));

router.delete(
  "/reservations/:id/cancel",
  requireUser,
  validate({ params: cancelReservationParamsSchema }),
  asyncHandler(deleteCancelReservation)
);

export default router;
