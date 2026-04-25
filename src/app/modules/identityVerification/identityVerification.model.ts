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

export const IdentityVerificationModel = model<IIdentityVerification>("IdentityVerification", identityVerificationSchema);
