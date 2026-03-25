import { z } from "zod";

export const createProductSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().min(10, "Description must be at least 10 characters long"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID"),
    subcategory: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid subcategory ID"),
    images: z.array(z.string()).optional(),
    isBoosted: z.boolean().default(false).optional(),
    boostPack: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid boost pack ID").optional(),
});

export const updateProductStatusSchema = z.object({
    status: z.enum(["ACTIVE", "SOLD", "PENDING", "REJECTED"]),
});

export const boostProductSchema = z.object({
    boostPackId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid boost pack ID"),
});
