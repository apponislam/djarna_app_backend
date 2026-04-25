import { Schema, model } from "mongoose";
import { IIdentityVerification } from "./identityVerification.interface";

const identityVerificationSchema = new Schema<IIdentityVerification>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        documentType: {
            type: String,
            enum: ["NID", "PASSPORT"],
            required: true,
        },
        frontImage: {
            type: String,
            required: true,
        },
        backImage: {
            type: String,
        },
        selfieImage: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
        },
        adminComment: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

// Deep indexing for optimized queries
identityVerificationSchema.index({ status: 1 });
identityVerificationSchema.index({ status: 1, createdAt: -1 });
identityVerificationSchema.index({ documentType: 1 });

export const IdentityVerificationModel = model<IIdentityVerification>("IdentityVerification", identityVerificationSchema);
