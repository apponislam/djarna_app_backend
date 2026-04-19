import { z } from "zod";

export const createProductSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().min(10, "Description must be at least 10 characters long"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    originalPrice: z.coerce.number().min(0, "Original price cannot be negative").optional(),
    category: z.string().min(1, "Category is required"),
    subcategory: z.string().min(1, "Subcategory is required"),
    location: z
        .object({
            lat: z.number().optional(),
            lng: z.number().optional(),
        })
        .optional(),
    address: z.string().optional(),
    gender: z.enum(["MEN", "WOMEN", "KID"]).optional(),
    size: z.enum(["XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL"]).optional(),
    images: z.array(z.string()).optional(),
    status: z.enum(["ACTIVE", "SOLD", "PENDING", "REJECTED", "DRAFT"]).optional(),
    isBoosted: z.boolean().default(false).optional(),
    boostPack: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid boost pack ID")
        .optional(),
});

export const updateProductStatusSchema = z.object({
    status: z.enum(["ACTIVE", "SOLD", "PENDING", "REJECTED", "DRAFT"]),
});

export const boostProductSchema = z.object({
    boostPackId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid boost pack ID"),
});
