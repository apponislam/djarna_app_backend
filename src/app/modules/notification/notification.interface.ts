import { Types } from "mongoose";

export type NotificationType = "ORDER_PLACED" | "ORDER_STATUS_UPDATE" | "ORDER_DELIVERED" | "ORDER_CANCELLED" | "PAYMENT_COMPLETED" | "WITHDRAWAL_REQUEST" | "WITHDRAWAL_COMPLETED" | "WITHDRAWAL_FAILED" | "PRODUCT_SOLD" | "PRODUCT_PROMOTED" | "FOLLOWED_YOU" | "NEW_MESSAGE" | "REVIEW_RECEIVED" | "DISPUTE_OPENED" | "DISPUTE_RESOLVED" | "REFUND_PROCESSED" | "SYSTEM";

export interface INotification {
    user: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    data?: Record<string, any>;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
