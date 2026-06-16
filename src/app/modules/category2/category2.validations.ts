import { z } from "zod";

export const createCategory2Schema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters long"),
    icon: z.string().optional(),
    isActive: z.boolean().default(true),
    parentCategory: z.string().nullable().optional(),
    homePosition: z.number().nullable().optional(),
    homeVisibility: z.boolean().default(true),
    level: z.number().min(1).max(4).optional(),
});

export const updateCategory2Schema = z.object({
    name: z.string().min(2).optional(),
    icon: z.string().optional(),
    isActive: z.boolean().optional(),
    parentCategory: z.string().nullable().optional(),
    homePosition: z.number().nullable().optional(),
    homeVisibility: z.boolean().optional(),
    level: z.number().min(1).max(4).optional(),
});
