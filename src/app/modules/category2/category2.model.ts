import mongoose, { Schema } from "mongoose";
import { ICategory2 } from "./category2.interface";

const Category2Schema = new Schema<ICategory2>(
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
            ref: "Category2",
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
Category2Schema.index({ name: "text" });
Category2Schema.index({ parentCategory: 1, name: 1 }, { unique: true });
Category2Schema.index({ parentCategory: 1 });
Category2Schema.index({ isActive: 1 });
Category2Schema.index({ level: 1 });
Category2Schema.index(
    { homePosition: 1 },
    { unique: true, partialFilterExpression: { homePosition: { $ne: null } } }
);

export const Category2Model = mongoose.model<ICategory2>("Category2", Category2Schema);
