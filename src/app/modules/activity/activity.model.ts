import { Schema, model } from "mongoose";
import { IActivity } from "./activity.interface";

const ActivitySchema = new Schema<IActivity>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["LOGIN", "REGISTER", "PRODUCT_CREATE", "PRODUCT_UPDATE", "ORDER_PLACED", "ORDER_STATUS_UPDATE", "PAYMENT_COMPLETED", "WITHDRAWAL_REQUEST"],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        details: {
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

// Indexing for quick retrieval of recent activities for a user or admin
ActivitySchema.index({ user: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });
ActivitySchema.index({ createdAt: -1 });

export const ActivityModel = model<IActivity>("Activity", ActivitySchema);
