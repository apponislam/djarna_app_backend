import { z } from "zod";

const currencyEnum = z.enum(["XOF", "EUR", "USD", "GBP"]);

export const updateSettingsSchema = z.object({
    payment: z
        .object({
            commissionRate: z.number().min(0).max(100).optional(),
            escrowDuration: z.number().min(1).optional(),
        })
        .optional(),

    currency: z
        .object({
            primary: currencyEnum.optional(),
            supported: z.array(currencyEnum).optional(),
        })
        .optional(),

    location: z
        .object({
            countries: z.array(z.string()).optional(),
            cities: z.array(z.string()).optional(),
            removeCountries: z.array(z.string()).optional(),
            removeCities: z.array(z.string()).optional(),
        })
        .optional(),

    notifications: z
        .object({
            email: z.boolean().optional(),
            push: z.boolean().optional(),
        })
        .optional(),
});
