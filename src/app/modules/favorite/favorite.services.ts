import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { FavoriteModel } from "./favorite.model";
import { ProductModel } from "../product/product.model";

/**
 * Toggle favorite status of a product
 */
const toggleFavorite = async (userId: string, productId: string) => {
    // 1. Check if product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found!");
    }

    // 2. Check if already favorited
    const existingFavorite = await FavoriteModel.findOne({
        user: userId,
        product: productId,
    });

    if (existingFavorite) {
        // Remove from favorites
        await FavoriteModel.deleteOne({ _id: existingFavorite._id });
        return { isFavorited: false };
    } else {
        // Add to favorites
        await FavoriteModel.create({
            user: userId,
            product: productId,
        });
        return { isFavorited: true };
    }
};

/**
 * Get all favorite products for the current user
 */
const getMyFavorites = async (userId: string, query: { page?: number; limit?: number }) => {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const favorites = await FavoriteModel.find({ user: userId })
        .populate({
            path: "product",
            populate: [
                { path: "category", select: "_id name icon" },
                { path: "subcategory", select: "_id name icon" },
                { path: "user", select: "_id name photo phone" },
                { path: "boostPack", select: "_id name duration visibility" },
            ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await FavoriteModel.countDocuments({ user: userId });
    const totalPage = Math.ceil(total / limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        data: favorites.map((fav) => fav.product), // Return the product details directly
    };
};

export const FavoriteService = {
    toggleFavorite,
    getMyFavorites,
};
