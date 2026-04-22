import mongoose, { Schema } from "mongoose";
import { ICategory } from "./category.interface";

const CategorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true,
        },
        icon: {
            type: String,
        },
        gender: {
            type: [String],
            enum: ["MEN", "WOMEN", "KID", "UNISEX"],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        parentCategory: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        homePosition: {
            type: Number,
            default: null,
        },
        homeVisibility: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Index for better search performance
CategorySchema.index({ name: "text" });
CategorySchema.index({ parentCategory: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ homePosition: 1 });

export const CategoryModel = mongoose.model<ICategory>("Category", CategorySchema);
