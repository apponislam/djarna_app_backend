import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { IReview } from "./review.interface";
import { ReviewModel } from "./review.model";
import { ProductModel } from "../product/product.model";
import { UserModel } from "../auth/auth.model";

/**
 * Create a new review
 */
const createReview = async (userId: string, data: Partial<IReview>) => {
    const { product: productId, rating, comment } = data;

    // 1. Check if product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    // 2. Prevent self-review
    if (product.user.toString() === userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You cannot review your own product");
    }

    // 3. Check if user already reviewed this product
    const existingReview = await ReviewModel.findOne({
        user: userId,
        product: productId,
        isDeleted: false,
    });

    if (existingReview) {
        throw new ApiError(httpStatus.CONFLICT, "You have already reviewed this product");
    }

    // 4. Create review
    const review = await ReviewModel.create({
        user: userId,
        seller: product.user,
        product: productId,
        rating,
        comment,
    });

    return review;
};

/**
 * Get reviews for a specific user (seller)
 */
const getUserReviews = async (sellerId: string, query: { page?: number; limit?: number }) => {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filters = { seller: sellerId, isDeleted: false, adminVisibility: "show" };

    const reviews = await ReviewModel.find(filters).populate("user", "_id name photo").populate("product", "_id title images").sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    const total = await ReviewModel.countDocuments(filters);
    const totalPage = Math.ceil(total / limit);

    // Calculate average rating
    const stats = await ReviewModel.aggregate([
        { $match: { seller: new Types.ObjectId(sellerId), isDeleted: false, adminVisibility: "show" } },
        {
            $group: {
                _id: "$seller",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
            },
        },
    ]);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        stats: stats[0] || { averageRating: 0, totalReviews: 0 },
        data: reviews,
    };
};

/**
 * Get reviews for a specific product
 */
const getProductReviews = async (productId: string) => {
    return await ReviewModel.find({ product: productId, isDeleted: false, adminVisibility: "show" }).populate("user", "_id name photo").sort({ createdAt: -1 }).lean();
};

/**
 * Get all reviews (Admin)
 */
const getAllReviews = async (query: { page?: number; limit?: number; searchTerm?: string }) => {
    const { page = 1, limit = 10, searchTerm } = query;
    const skip = (page - 1) * limit;

    const filters: any = { isDeleted: false };

    if (searchTerm) {
        filters.comment = { $regex: searchTerm, $options: "i" };
    }

    const reviews = await ReviewModel.find(filters).populate("user", "_id name photo").populate("seller", "_id name photo").populate("product", "_id title images").sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

    const total = await ReviewModel.countDocuments(filters);
    const totalPage = Math.ceil(total / limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        data: reviews,
    };
};

/**
 * Delete a review
 */
const deleteReview = async (reviewId: string, userId: string, isAdmin: boolean) => {
    const filter: any = { _id: reviewId };
    if (!isAdmin) {
        filter.user = userId; // Only allow the reviewer to delete their own review
    }

    const result = await ReviewModel.findOneAndUpdate(filter, { isDeleted: true }, { new: true });

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found or you are not authorized to delete it");
    }

    return result;
};

/**
 * Update review visibility (Admin only)
 */
const updateReviewVisibility = async (reviewId: string, visibility: "show" | "hidden") => {
    const result = await ReviewModel.findByIdAndUpdate(reviewId, { adminVisibility: visibility }, { new: true });

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
    }

    return result;
};

export const ReviewService = {
    createReview,
    getUserReviews,
    getProductReviews,
    getAllReviews,
    deleteReview,
    updateReviewVisibility,
};
