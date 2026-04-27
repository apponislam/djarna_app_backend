import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { DashboardControllers } from "./dashboard.controllers";

const router = Router();

router.get("/stats", auth, authorize(["ADMIN"]), DashboardControllers.getDashboardStats);

router.get("/chart", auth, authorize(["ADMIN"]), DashboardControllers.getOrdersChartData);

router.get("/revenue", auth, authorize(["ADMIN"]), DashboardControllers.getRevenueChartData);

export const DashboardRoutes = router;
