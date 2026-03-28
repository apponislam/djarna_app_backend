import { Router } from "express";
import { SettingsController } from "./settings.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { updateSettingsSchema } from "./settings.validations";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Get settings - accessible to admins to manage the platform
router.get(
    "/",
    auth,
    authorize(["ADMIN"]),
    SettingsController.getSettings
);

// Update settings - strictly admin only
router.patch(
    "/",
    auth,
    authorize(["ADMIN"]),
    validateRequest(updateSettingsSchema),
    SettingsController.updateSettings
);

export const SettingsRoutes = router;
