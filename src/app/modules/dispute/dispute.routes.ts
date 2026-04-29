import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { DisputeController } from "./dispute.controllers";

const router = Router();

// Buyer can create a dispute
router.post("/", auth, authorize(["USER"]), DisputeController.createDispute);

// Admin can see all disputes
router.get("/all", auth, authorize(["ADMIN"]), DisputeController.getAllDisputes);

// Get specific dispute details
router.get("/:id", auth, DisputeController.getDisputeById);

// Admin can resolve a dispute
router.patch("/:id/resolve", auth, authorize(["ADMIN"]), DisputeController.resolveDispute);

export const DisputeRoutes = router;
