import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { DisputeController } from "./dispute.controllers";
import { uploadDisputeImages, parseBodyData } from "../../middlewares/multer";

const router = Router();

// Buyer can create a dispute
router.post("/", auth, authorize(["USER"]), uploadDisputeImages, parseBodyData, DisputeController.createDispute);

// User can get their own disputes
router.get("/my", auth, DisputeController.getMyDisputes);

// Admin can see all disputes
router.get("/all", auth, authorize(["ADMIN"]), DisputeController.getAllDisputes);

// Admin can get dispute stats
router.get("/stats", auth, authorize(["ADMIN"]), DisputeController.getDisputeStats);

// Get specific dispute details
router.get("/by-order/:orderId", auth, DisputeController.getDisputeByOrderId);
router.get("/:id", auth, DisputeController.getDisputeById);

// Buyer can cancel a dispute
router.patch("/:id/cancel", auth, authorize(["USER"]), DisputeController.cancelDispute);

// Admin can resolve a dispute
router.patch("/:id/resolve", auth, authorize(["ADMIN"]), DisputeController.resolveDispute);

export const DisputeRoutes = router;
