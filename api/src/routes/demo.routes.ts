import { Router } from "express";
import { z } from "zod";

import { validate } from "../middlewares/validate";
import { sendSuccess } from "../utils/respond";

const router = Router();

router.post(
  "/demo/echo",
  validate({
    body: z.object({
      email: z.string().email(),
      name: z.string().min(2).max(60).optional()
    })
  }),
  (req, res) => {
    return sendSuccess(
      res,
      { received: req.body },
      { requestId: res.locals.requestId },
      200
    );
  }
);

export default router;

