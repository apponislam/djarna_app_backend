import mongoose, { Schema } from "mongoose";
import { ICategory } from "./category.interface";

const CategorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
        },
        icon: {
            type: String,
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
        level: {
            type: Number,
            required: true,
            enum: [1, 2, 3, 4],
            default: 1,
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

// Indexes
CategorySchema.index({ name: "text" });
CategorySchema.index({ parentCategory: 1, name: 1 }, { unique: true });
CategorySchema.index({ parentCategory: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index(
    { homePosition: 1 },
    { unique: true, partialFilterExpression: { homePosition: { $ne: null } } }
);

export const CategoryModel = mongoose.model<ICategory>("Category", CategorySchema);
