import { Schema, model } from "mongoose";
import { IReview } from "./review.interface";

const reviewSchema = new Schema<IReview>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        adminVisibility: {
            type: String,
            enum: ["show", "hidden"],
            default: "show",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Indexing for faster lookups
reviewSchema.index({ seller: 1, createdAt: -1 });
reviewSchema.index({ product: 1 });

export const ReviewModel = model<IReview>("Review", reviewSchema);
