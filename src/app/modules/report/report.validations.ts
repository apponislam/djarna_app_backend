import { z } from "zod";

export const createReportSchema = z
    .object({
        type: z.enum(["LISTING", "USER"]),
        reportedItem: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reported item ID").optional(),
        reportedUser: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid reported user ID"),
        reason: z.string().min(5, "Reason must be at least 5 characters long"),
        details: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.type === "LISTING" && !data.reportedItem) {
                return false;
            }
            return true;
        },
        {
            message: "Reported item is required for LISTING reports",
            path: ["reportedItem"],
        }
    );

export const updateReportStatusSchema = z.object({
    status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED"]),
});
