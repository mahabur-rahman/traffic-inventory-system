import { Router } from "express";

import { requireUser } from "../middlewares/auth";
import { sendSuccess } from "../utils/respond";

const router = Router();

router.get("/me", requireUser, (req, res) => {
  return sendSuccess(res, { user: req.user }, { requestId: res.locals.requestId });
});

export default router;

