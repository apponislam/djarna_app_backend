import { Router } from "express";
import { BoostPaymentController } from "./boostPayment.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { initializeBoostPaymentSchema, verifyBoostPaymentSchema } from "./boostPayment.validations";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = Router();

router.post("/initialize", auth, validateRequest(initializeBoostPaymentSchema), BoostPaymentController.initializeBoostPayment);

router.post("/verify", auth, validateRequest(verifyBoostPaymentSchema), BoostPaymentController.verifyBoostPayment);

router.get("/my-payments", auth, BoostPaymentController.getMyBoostPayments);

router.get("/:id", auth, BoostPaymentController.getSingleBoostPayment);

router.get("/", auth, authorize(["ADMIN"]), BoostPaymentController.getAllBoostPayments);

export const BoostPaymentRoutes = router;
