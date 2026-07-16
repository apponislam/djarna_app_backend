import { Router } from "express";
import { BlockController } from "./block.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { blockUserSchema } from "./block.validations";
import auth from "../../middlewares/auth";

const router = Router();

// Block a user
router.post("/", auth, validateRequest(blockUserSchema), BlockController.blockUser);

// Unblock a user
router.delete("/", auth, validateRequest(blockUserSchema), BlockController.unblockUser);

// List blocked users
router.get("/", auth, BlockController.getBlockedUsers);

export const BlockRoutes = router;
