import { Types } from "mongoose";

export interface IReview {
    user: Types.ObjectId; // User who is giving the review
    seller: Types.ObjectId; // User (seller) who is receiving the review
    product: Types.ObjectId; // Product related to the review
    rating: number; // Rating from 1 to 5
    comment: string;
    isDeleted: boolean;
    adminVisibility: "show" | "hidden";
}
