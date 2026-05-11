import { Schema, model } from "mongoose";
import { INotification } from "./notification.interface";

const NotificationSchema = new Schema<INotification>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "ORDER_PLACED", 
                "ORDER_STATUS_UPDATE", 
                "ORDER_DELIVERED", 
                "ORDER_CANCELLED",
                "PAYMENT_COMPLETED",
                "WITHDRAWAL_REQUEST",
                "WITHDRAWAL_COMPLETED",
                "WITHDRAWAL_FAILED",
                "PRODUCT_SOLD",
                "PRODUCT_PROMOTED",
                "FOLLOWED_YOU",
                "NEW_MESSAGE",
                "REVIEW_RECEIVED",
                "DISPUTE_OPENED",
                "DISPUTE_RESOLVED",
                "REFUND_PROCESSED",
                "SYSTEM"
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        data: {
            type: Schema.Types.Mixed,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

export const NotificationModel = model<INotification>("Notification", NotificationSchema);
