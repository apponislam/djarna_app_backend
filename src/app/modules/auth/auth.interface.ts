import { Types } from "mongoose";

export type UserRole = "USER" | "ADMIN";

export interface User {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone: string;
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
    isEmailVerified: boolean;
    lastLogin?: Date;

    // Password reset fields
    resetPasswordOtp?: string;
    resetPasswordOtpExpiry?: Date;
    resetPasswordToken?: string;
    resetPasswordTokenExpiry?: Date;

    // Email verification fields (new)
    verificationToken?: string;
    verificationExpiry?: Date;

    // Email update fields
    pendingEmail?: string;
    emailVerificationToken?: string;
    emailVerificationExpiry?: Date;

    // Referral fields
    referralCode: string;
    referredBy?: Types.ObjectId; // Relation to the user who referred

    createdAt: Date;
    updatedAt: Date;
}
