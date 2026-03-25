import { z } from "zod";

export const createBoostPackSchema = z.object({
    name: z.string().min(3, "Pack name must be at least 3 characters long"),
    duration: z.number().int().min(1, "Duration must be at least 1 day"),
    listingsCount: z.number().int().min(1, "Must boost at least 1 listing"),
    visibility: z.enum(["MEDIUM", "HIGH"]),
    price: z.number().min(0, "Price cannot be negative"),
    currency: z.string().default("FCFA").optional(),
    isActive: z.boolean().default(true).optional(),
});

export const updateBoostPackSchema = z.object({
    name: z.string().min(3).optional(),
    duration: z.number().int().min(1).optional(),
    listingsCount: z.number().int().min(1).optional(),
    visibility: z.enum(["MEDIUM", "HIGH"]).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().optional(),
    isActive: z.boolean().optional(),
});
