import { Router } from "express";
import { ReportController } from "./report.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { createReportSchema, updateReportStatusSchema } from "./report.validations";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Protected User routes
router.post("/", auth, validateRequest(createReportSchema), ReportController.createReport);

// Protected Admin only management routes
router.get("/", auth, authorize(["ADMIN"]), ReportController.getAllReports);

router.get("/:id", auth, authorize(["ADMIN"]), ReportController.getReportById);

router.patch("/:id/status", auth, authorize(["ADMIN"]), validateRequest(updateReportStatusSchema), ReportController.updateReportStatus);

export const ReportRoutes = router;
