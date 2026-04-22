import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters long"),
    icon: z.string().optional(),
    gender: z.array(z.enum(["MEN", "WOMEN", "KID", "UNISEX"])).optional(),
    isActive: z.boolean().default(true),
    parentCategory: z.string().nullable().optional(),
    homePosition: z.number().nullable().optional(),
    homeVisibility: z.boolean().default(true),
});

export const updateCategorySchema = z.object({
    name: z.string().min(2).optional(),
    icon: z.string().optional(),
    gender: z.array(z.enum(["MEN", "WOMEN", "KID", "UNISEX"])).optional(),
    isActive: z.boolean().optional(),
    parentCategory: z.string().nullable().optional(),
    homePosition: z.number().nullable().optional(),
    homeVisibility: z.boolean().optional(),
});
