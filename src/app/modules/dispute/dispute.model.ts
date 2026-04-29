import { Schema, model } from "mongoose";
import { IDispute } from "./dispute.interface";

const DisputeSchema = new Schema<IDispute>(
    {
        order: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },
        payment: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
            required: true,
            index: true,
        },
        buyer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reason: {
            type: String,
            enum: ["ITEM_NOT_RECEIVED", "ITEM_NOT_AS_DESCRIBED", "DAMAGED_ITEM", "UNAUTHORIZED_TRANSACTION", "OTHER"],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: [
            {
                type: String,
            },
        ],
        status: {
            type: String,
            enum: ["PENDING", "IN_REVIEW", "RESOLVED", "REJECTED", "CANCELLED"],
            default: "PENDING",
            index: true,
        },
        adminNote: {
            type: String,
        },
        refundAmount: {
            type: Number,
        },
        resolvedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Indexes for optimized searching
DisputeSchema.index({ status: 1, createdAt: -1 });
DisputeSchema.index({ buyer: 1, createdAt: -1 });
DisputeSchema.index({ seller: 1, createdAt: -1 });

export const DisputeModel = model<IDispute>("Dispute", DisputeSchema);
