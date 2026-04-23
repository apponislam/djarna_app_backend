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

    // Use aggregation to join with products and filter out non-existent or deleted ones
    const pipeline: any[] = [
        { $match: { user: new Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "product",
            },
        },
        { $unwind: "$product" },
        // Filter out deleted products
        { $match: { "product.isDeleted": false } },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    // Lookup user details for the product
                    {
                        $lookup: {
                            from: "users",
                            let: { userId: "$product.user" },
                            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } }, { $project: { _id: 1, name: 1, photo: 1, phone: 1 } }],
                            as: "product.user",
                        },
                    },
                    { $unwind: "$product.user" },
                    // Lookup boostPack if exists
                    {
                        $lookup: {
                            from: "boostpacks",
                            localField: "product.boostPack",
                            foreignField: "_id",
                            as: "product.boostPack",
                        },
                    },
                    {
                        $addFields: {
                            "product.boostPack": {
                                $ifNull: [{ $arrayElemAt: ["$product.boostPack", 0] }, null],
                            },
                        },
                    },
                    { $replaceRoot: { newRoot: "$product" } },
                ],
            },
        },
    ];

    const result = await FavoriteModel.aggregate(pipeline);

    const total = result[0]?.metadata[0]?.total || 0;
    const data = result[0]?.data || [];
    const totalPage = Math.ceil(total / limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        data,
    };
};

export const FavoriteService = {
    toggleFavorite,
    getMyFavorites,
};
