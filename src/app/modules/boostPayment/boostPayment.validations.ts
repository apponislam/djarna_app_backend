import { z } from "zod";

export const initializeBoostPaymentSchema = z.object({
    productId: z.string().optional(),
    boostPackId: z.string().min(1, "Boost Pack ID is required"),
});

export const verifyBoostPaymentSchema = z.object({
    token: z.string().min(1, "Invoice token is required"),
});
