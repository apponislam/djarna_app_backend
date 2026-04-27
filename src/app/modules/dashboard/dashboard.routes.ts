import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { DashboardControllers } from "./dashboard.controllers";

const router = Router();

router.get(
    "/stats",
    auth,
    authorize(["ADMIN"]),
    DashboardControllers.getDashboardStats,
);

export const DashboardRoutes = router;
