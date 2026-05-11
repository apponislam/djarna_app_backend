import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { NotificationModel } from "./notification.model";
import { INotification } from "./notification.interface";
import { UserModel } from "../auth/auth.model";

const createNotification = async (data: Omit<INotification, "isRead" | "isDeleted" | "createdAt" | "updatedAt">) => {
    const notification = await NotificationModel.create({
        ...data,
        isRead: false,
        isDeleted: false,
    });
    return notification;
};

const getNotifications = async (userId: string, page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit;

    const notifications = await NotificationModel.find({
        user: userId,
        isDeleted: false,
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await NotificationModel.countDocuments({
        user: userId,
        isDeleted: false,
    });

    return {
        data: notifications,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getUnreadCount = async (userId: string) => {
    const count = await NotificationModel.countDocuments({
        user: userId,
        isRead: false,
        isDeleted: false,
    });
    return { unreadCount: count };
};

const markAsRead = async (userId: string, notificationIds: string[]) => {
    const result = await NotificationModel.updateMany(
        {
            _id: { $in: notificationIds },
            user: userId,
        },
        { $set: { isRead: true } },
    );

    if (result.matchedCount === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Notifications not found");
    }

    return { message: "Notifications marked as read" };
};

const markAllAsRead = async (userId: string) => {
    await NotificationModel.updateMany(
        {
            user: userId,
            isRead: false,
        },
        { $set: { isRead: true } },
    );

    return { message: "All notifications marked as read" };
};

const deleteNotification = async (userId: string, notificationId: string) => {
    const notification = await NotificationModel.findOneAndUpdate(
        {
            _id: notificationId,
            user: userId,
        },
        { $set: { isDeleted: true } },
        { new: true },
    );

    if (!notification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
    }

    return { message: "Notification deleted successfully" };
};

const deleteAllNotifications = async (userId: string) => {
    await NotificationModel.updateMany(
        {
            user: userId,
            isDeleted: false,
        },
        { $set: { isDeleted: true } },
    );

    return { message: "All notifications deleted successfully" };
};

const sendNotification = async (userId: string, type: any, title: string, message: string, data?: Record<string, any>) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const notification = await createNotification({
        user: user._id,
        type,
        title,
        message,
        data,
    });

    return notification;
};

export const notificationServices = {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    sendNotification,
};
