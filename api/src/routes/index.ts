import { Router } from "express";

import healthRoutes from "./health.routes";
import demoRoutes from "./demo.routes";
import meRoutes from "./me.routes";
import dropsRoutes from "./drops.routes";

const router = Router();

router.use(healthRoutes);
router.use(demoRoutes);
router.use(meRoutes);
router.use(dropsRoutes);

export default router;
