import mongoose, { Schema, Document } from "mongoose";

export interface IVerification extends Document {
    phone: string;
    otp: string;
    expiry: Date;
    isVerified: boolean;
    referralCode?: string;
}

const VerificationSchema = new Schema<IVerification>(
    {
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiry: {
            type: Date,
            required: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        referralCode: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

// Auto-delete after 15 minutes
VerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

export const VerificationModel = mongoose.model<IVerification>("Verification", VerificationSchema);
