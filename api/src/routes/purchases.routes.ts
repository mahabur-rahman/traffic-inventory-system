import { Router } from "express";

import { requireUser } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { postPurchase } from "../controllers/purchases.controller";
import { purchaseParamsSchema } from "../validators/purchase.schemas";

const router = Router();

router.post(
  "/drops/:dropId/purchase",
  requireUser,
  validate({ params: purchaseParamsSchema }),
  asyncHandler(postPurchase)
);

export default router;

