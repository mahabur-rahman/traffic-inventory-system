import { Router } from "express";

import { requireUser } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { getDrops, postDrop } from "../controllers/drops.controller";
import { createDropBodySchema, listDropsQuerySchema } from "../validators/drop.schemas";

const router = Router();

router.post("/drops", requireUser, validate({ body: createDropBodySchema }), asyncHandler(postDrop));
router.get("/drops", validate({ query: listDropsQuerySchema }), asyncHandler(getDrops));

export default router;

