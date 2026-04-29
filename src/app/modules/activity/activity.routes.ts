import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { ActivityController } from "./activity.controllers";

const router = Router();

// Admin only route to see all activity
router.get("/all", auth, authorize(["ADMIN"]), ActivityController.getAllActivities);

// User route to see their own activity
router.get("/me", auth, ActivityController.getMyActivities);

export const ActivityRoutes = router;
