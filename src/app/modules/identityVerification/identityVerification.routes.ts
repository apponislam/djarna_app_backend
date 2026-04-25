import { Router } from "express";
import auth from "../../middlewares/auth";
import { IdentityVerificationController } from "./identityVerification.controllers";
import { parseBodyData, uploadVerificationDocs } from "../../middlewares/multer";

const router = Router();

// User routes
router.post("/submit", auth, uploadVerificationDocs, parseBodyData, IdentityVerificationController.submitVerification);
router.get("/my-status", auth, IdentityVerificationController.getMyVerificationStatus);

// Admin routes
router.get("/requests", auth, IdentityVerificationController.getAllVerificationRequests);
router.patch("/:id/status", auth, IdentityVerificationController.updateVerificationStatus);

export const IdentityVerificationRoutes = router;
