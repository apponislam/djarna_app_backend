import mongoose, { Schema } from "mongoose";
import { IBoostPack } from "./boostPack.interface";

const BoostPackSchema = new Schema<IBoostPack>(
    {
        name: {
            type: String,
            required: [true, "Boost pack name is required"],
            trim: true,
        },
        description: {
            type: String,
        },
        type: {
            type: String,
            enum: ["PRODUCT", "SHOP"],
            required: [true, "Boost pack type is required"],
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
        isRecommended: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Indexes for query optimization
BoostPackSchema.index({ isActive: 1, type: 1, price: 1, isDeleted: 1 });
BoostPackSchema.index({ type: 1, isActive: 1, isDeleted: 1 });
BoostPackSchema.index({ duration: 1, isDeleted: 1 });

// Ensure only one recommended pack per type
BoostPackSchema.index({ type: 1, isRecommended: 1 });

export const BoostPackModel = mongoose.model<IBoostPack>("BoostPack", BoostPackSchema);
