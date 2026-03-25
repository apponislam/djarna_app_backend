import { Router } from "express";
import { BoostPackController } from "./boostPack.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { createBoostPackSchema, updateBoostPackSchema } from "./boostPack.validations";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

// Publicly available for sellers to see and choose
router.get("/", auth, BoostPackController.getAllBoostPacks);
router.get("/:id", auth, BoostPackController.getBoostPackById);

// Admin only routes for managing packs
router.post(
    "/",
    auth,
    authorize(["ADMIN"]),
    validateRequest(createBoostPackSchema),
    BoostPackController.createBoostPack
);

router.patch(
    "/:id",
    auth,
    authorize(["ADMIN"]),
    validateRequest(updateBoostPackSchema),
    BoostPackController.updateBoostPack
);

router.patch(
    "/:id/toggle-status",
    auth,
    authorize(["ADMIN"]),
    BoostPackController.toggleBoostPackStatus
);

router.delete(
    "/:id",
    auth,
    authorize(["ADMIN"]),
    BoostPackController.deleteBoostPack
);

export const BoostPackRoutes = router;
