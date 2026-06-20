import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { notificationServices } from "./notification.services";

const getNotifications = catchAsync(async (req, res) => {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await notificationServices.getNotifications(userId, page, limit);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notifications récupérées avec succès",
        data: result,
    });
});

const getUnreadCount = catchAsync(async (req, res) => {
    const userId = req.user!._id;
    const result = await notificationServices.getUnreadCount(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Nombre de notifications non lues récupéré avec succès",
        data: result,
    });
});

const markAsRead = catchAsync(async (req, res) => {
    const userId = req.user!._id;
    const { notificationIds } = req.body;

    const result = await notificationServices.markAsRead(userId, notificationIds);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const markAllAsRead = catchAsync(async (req, res) => {
    const userId = req.user!._id;
    const result = await notificationServices.markAllAsRead(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const deleteNotification = catchAsync(async (req, res) => {
    const userId = req.user!._id;
    const notificationId = req.params.id;

    const result = await notificationServices.deleteNotification(userId, notificationId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const deleteAllNotifications = catchAsync(async (req, res) => {
    const userId = req.user!._id;
    const result = await notificationServices.deleteAllNotifications(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const notificationControllers = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
};
