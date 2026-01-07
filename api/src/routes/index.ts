import { Router } from "express";

import healthRoutes from "./health.routes";
import demoRoutes from "./demo.routes";

const router = Router();

router.use(healthRoutes);
router.use(demoRoutes);

export default router;
