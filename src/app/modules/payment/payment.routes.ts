import { Router } from "express";
import { PaymentController } from "./payment.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

router.post("/", auth, PaymentController.initializePayment);

router.get("/verify", PaymentController.verifyPayment);

router.get("/my-payments", auth, PaymentController.getMyPayments);

router.get("/:id", auth, PaymentController.getPaymentById);

router.get("/", auth, authorize(["ADMIN"]), PaymentController.getAllPayments);

router.post("/:id/refund", auth, authorize(["ADMIN"]), PaymentController.refundPayment);

export const PaymentRoutes = router;
