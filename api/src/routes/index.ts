import { Router } from "express";

import healthRoutes from "./health.routes";
import demoRoutes from "./demo.routes";
import meRoutes from "./me.routes";

const router = Router();

router.use(healthRoutes);
router.use(demoRoutes);
router.use(meRoutes);

export default router;
