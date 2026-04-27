import { Router } from "express";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { WithdrawController } from "./withdraw.controllers";

const router = Router();

router.post("/", auth, WithdrawController.requestWithdrawal);
router.get("/my-withdrawals", auth, WithdrawController.getMyWithdrawals);
router.get("/", auth, authorize(["ADMIN"]), WithdrawController.getAllWithdrawals);

export const WithdrawRoutes = router;
