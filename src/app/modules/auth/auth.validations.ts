import { z } from "zod";

const locationSchema = z.object({
    fullAddress: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
});

const addressSchema = z.object({
    fullName: z.string().optional(),
    country: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
});

export const registerSchema = z.object({
    name: z.string().trim().min(2),

    email: z.string().trim().email().optional(),

    password: z.string().trim().min(6),

    role: z.enum(["USER", "ADMIN"]).default("USER"),

    phone: z.string().trim().min(1, "Phone is required"),

    photo: z.string().optional(),

    location: locationSchema.optional(),

    address: addressSchema.optional(),

    referralCode: z.string().optional(),
});

export const loginSchema = z.object({
    phone: z.string().trim().min(1, "Phone is required"),
    password: z.string().trim(),
});

export const sendOtpSchema = z.object({
    phone: z.string().trim().min(1, "Phone is required"),
    referralCode: z.string().optional(),
});

export const verifyOtpSchema = z.object({
    phone: z.string().trim().min(1, "Phone is required"),
    otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resendVerificationSchema = z.object({
    phone: z.string().trim().min(1, "Phone is required"),
});

export const updateProfileSchema = z.object({
    name: z.string().trim().min(2).optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
    photo: z.string().optional(),
    location: locationSchema.optional(),
    address: addressSchema.optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
});

export const requestPasswordResetSchema = z.object({
    phone: z.string().trim().min(1, "Phone is required"),
});

export const resetPasswordSchema = z.object({
    phone: z.string().trim().min(1, "Phone is required"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(6),
});
