import { Schema, model } from "mongoose";
import { IPlatformSettings } from "./settings.interface";

const platformSettingsSchema = new Schema<IPlatformSettings>(
    {
        payment: {
            commissionRate: { type: Number, required: true, default: 8 },
            escrowDuration: { type: Number, required: true, default: 72 },
        },

        currency: {
            primary: {
                type: String,
                enum: ["XOF", "EUR", "USD", "GBP"],
                default: "XOF",
            },
            supported: [
                {
                    type: String,
                    enum: ["XOF", "EUR", "USD", "GBP"],
                },
            ],
        },

        location: {
            countries: [{ type: String }],
            cities: [{ type: String }],
        },

        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
        },
    },
    {
        timestamps: true,
    },
);

export const SettingsModel = model<IPlatformSettings>("Settings", platformSettingsSchema);
