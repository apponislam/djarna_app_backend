import { Types } from "mongoose";

export type UserRole = "USER" | "ADMIN";

export interface User {
    name: string;
    email?: string;
    password: string;
    role: UserRole;
    phone: string;
    photo?: string;
    location?: {
        lat?: number;
        lng?: number;
    };
    language?: string;
    address?: {
        fullName?: string;
        country?: string;
        addressLine1?: string;
        addressLine2?: string;
        postcode?: string;
        city?: string;
    };
    isActive: boolean;
    isPhoneVerified: boolean;
    lastLogin?: Date;

    // Password reset fields
    resetPasswordOtp?: string;
    resetPasswordOtpExpiry?: Date;
    resetPasswordToken?: string;
    resetPasswordTokenExpiry?: Date;

    // Phone verification fields
    phoneVerificationOtp?: string;
    phoneVerificationExpiry?: Date;

    // Referral fields
    referralCode: string;
    referredBy?: Types.ObjectId; // Relation to the user who referred

    balance: number;
    noCommission: number;

    createdAt: Date;
    updatedAt: Date;
}
