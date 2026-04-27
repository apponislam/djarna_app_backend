import express from "express";
import { OrderController } from "./order.controllers";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";

const router = express.Router();

router.post("/", auth, OrderController.createOrder);
router.get("/admin/all-orders", auth, authorize(["ADMIN"]), OrderController.adminGetAllOrders);
router.get("/admin/order-stats", auth, authorize(["ADMIN"]), OrderController.adminGetOrderStats);
router.get("/admin/single-order/:id", auth, authorize(["ADMIN"]), OrderController.adminGetOrderById);
router.get("/my-orders", auth, OrderController.getMyOrders);
router.get("/:id", auth, OrderController.getOrderById);
router.patch("/:id/status", auth, OrderController.updateOrderStatus);

export const OrderRoutes = router;
