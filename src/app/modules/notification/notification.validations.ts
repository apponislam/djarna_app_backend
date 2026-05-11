import { z } from "zod";

export const markAsReadSchema = z.object({
    notificationIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification ID")),
});
