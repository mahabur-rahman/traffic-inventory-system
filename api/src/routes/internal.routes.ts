import { Router } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { postExpireNow } from "../controllers/internal.controller";

const router = Router();

router.post("/expire-now", asyncHandler(postExpireNow));

export default router;

