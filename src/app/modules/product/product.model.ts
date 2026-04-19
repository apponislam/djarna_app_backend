import mongoose, { Schema } from "mongoose";
import { IProduct } from "./product.interface";

const ProductSchema = new Schema<IProduct>(
    {
        title: {
            type: String,
            required: [true, "Product title is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Product description is required"],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },
        originalPrice: {
            type: Number,
            min: [0, "Original price cannot be negative"],
        },
        category: {
            type: String,
            ref: "Category",
            required: [true, "Category is required"],
        },
        subcategory: {
            type: String,
            ref: "Category",
            required: [true, "Subcategory is required"],
        },
        location: {
            lat: { type: Number },
            lng: { type: Number },
        },
        address: {
            type: String,
        },
        gender: {
            type: String,
            enum: ["MEN", "WOMEN", "KID"],
        },
        size: {
            type: String,
            enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL"],
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        images: {
            type: [String],
            required: [true, "At least one product image is required"],
            validate: {
                validator: (val: string[]) => val.length > 0,
                message: "Product must have at least one image",
            },
        },
        status: {
            type: String,
            enum: ["ACTIVE", "SOLD", "PENDING", "REJECTED", "DRAFT"],
            default: "ACTIVE",
        },

        // Boost Handling
        isBoosted: {
            type: Boolean,
            default: false,
        },
        boostPack: {
            type: Schema.Types.ObjectId,
            ref: "BoostPack",
            default: null,
        },
        boostStartTime: {
            type: Date,
            default: null,
        },
        boostEndTime: {
            type: Date,
            default: null,
        },
    },

    {
        timestamps: true,
        versionKey: false,
    },
);

// Search optimization (Production Safe)
ProductSchema.index({ title: "text", description: "text", address: "text" });
ProductSchema.index({ category: 1 });
ProductSchema.index({ subcategory: 1 });
ProductSchema.index({ user: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isBoosted: -1, boostEndTime: -1 }); // Boosted items prioritized
ProductSchema.index({ createdAt: -1 });

export const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);
