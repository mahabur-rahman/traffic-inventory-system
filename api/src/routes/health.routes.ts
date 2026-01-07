import { Router } from "express";

import { health } from "../controllers/health.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/health", asyncHandler(health));

export default router;
