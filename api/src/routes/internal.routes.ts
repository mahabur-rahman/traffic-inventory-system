import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { postCreateUser, postExpireNow } from "../controllers/internal.controller";
import { validate } from "../middlewares/validate";
import { createUserBodySchema } from "../validators/internal.schemas";

const router = Router();

router.post("/expire-now", asyncHandler(postExpireNow));
router.post("/users", validate({ body: createUserBodySchema }), asyncHandler(postCreateUser));

export default router;
