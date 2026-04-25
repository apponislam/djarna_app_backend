import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { UserControllers } from "./user.controllers";

const router = Router();

// Get user statistics (Admin only)
router.get("/stats", auth, authorize(["ADMIN"]), UserControllers.getUserStats);

// Get all users (Admin only)
router.get("/", auth, authorize(["ADMIN"]), UserControllers.getAllUsers);

// Get single user
router.get("/:id", auth, UserControllers.getSingleUser);

export const UserRoutes = router;
