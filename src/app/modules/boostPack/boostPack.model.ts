import mongoose, { Schema } from "mongoose";
import { IBoostPack } from "./boostPack.interface";

const BoostPackSchema = new Schema<IBoostPack>(
    {
        name: {
            type: String,
            required: [true, "Boost pack name is required"],
            unique: true,
            trim: true,
        },
        duration: {
            type: Number,
            required: [true, "Duration in days is required"],
            min: [1, "Duration must be at least 1 day"],
        },
        listingsCount: {
            type: Number,
            required: [true, "Number of listings to boost is required"],
            min: [1, "At least 1 listing must be boosted"],
        },
        visibility: {
            type: String,
            enum: ["MEDIUM", "HIGH"],
            required: [true, "Visibility level is required"],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        currency: {
            type: String,
            default: "FCFA",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Indexes for common queries
BoostPackSchema.index({ isActive: 1 });
// BoostPackSchema.index({ name: 1 });

export const BoostPackModel = mongoose.model<IBoostPack>("BoostPack", BoostPackSchema);
