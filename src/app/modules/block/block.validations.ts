import { z } from "zod";

export const blockUserSchema = z.object({
    blockedId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
});
