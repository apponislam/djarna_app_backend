import express from "express";
import { OrderController } from "./order.controllers";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/", auth, OrderController.createOrder);
router.get("/my-orders", auth, OrderController.getMyOrders);
router.get("/:id", auth, OrderController.getOrderById);
router.patch("/:id/status", auth, OrderController.updateOrderStatus);

export const OrderRoutes = router;
