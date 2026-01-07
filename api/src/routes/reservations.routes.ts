import { Router } from "express";

import { requireUser } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { getMyReservations, postReserve } from "../controllers/reservations.controller";
import { reserveParamsSchema } from "../validators/reservation.schemas";

const router = Router();

router.post(
  "/drops/:dropId/reserve",
  requireUser,
  validate({ params: reserveParamsSchema }),
  asyncHandler(postReserve)
);

router.get("/reservations/me", requireUser, asyncHandler(getMyReservations));

export default router;

