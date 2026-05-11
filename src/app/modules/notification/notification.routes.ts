import { Router } from "express";
import { notificationControllers } from "./notification.controllers";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { markAsReadSchema } from "./notification.validations";

const router = Router();

router.get("/", auth, notificationControllers.getNotifications);
router.get("/unread-count", auth, notificationControllers.getUnreadCount);
router.patch("/mark-read", auth, validateRequest(markAsReadSchema), notificationControllers.markAsRead);
router.patch("/mark-all-read", auth, notificationControllers.markAllAsRead);
router.delete("/:id", auth, notificationControllers.deleteNotification);
router.delete("/", auth, notificationControllers.deleteAllNotifications);

export const NotificationRoutes = router;
