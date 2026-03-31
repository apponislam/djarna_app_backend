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

    email: z.string().trim().email(),

    password: z.string().trim().min(6),

    role: z.enum(["USER", "ADMIN"]).default("USER"),

    phone: z.string().trim().min(1, "Phone is required"),

    location: locationSchema.optional(),

    address: addressSchema.optional(),

    referralCode: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().trim(),
});

export const verifyEmailSchema = z.object({
    token: z.string(),
    email: z.string().email(),
});

export const resendVerificationSchema = z.object({
    email: z.string().email(),
});

export const updateProfileSchema = z.object({
    name: z.string().trim().min(2).optional(),
    phone: z.string().trim().optional(),
    location: locationSchema.optional(),
    address: addressSchema.optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
});

export const updateEmailSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const resendEmailUpdateSchema = z.object({
    password: z.string(),
});
