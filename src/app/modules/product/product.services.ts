import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ProductModel } from "./product.model";
import { IProduct } from "./product.interface";
import { BoostPackModel } from "../boostPack/boostPack.model";
import mongoose from "mongoose";
import { FavoriteModel } from "../favorite/favorite.model";

const createProduct = async (payload: IProduct) => {
    // If the product is being boosted during creation
    if (payload.isBoosted && payload.boostPack) {
        const pack = await BoostPackModel.findById(payload.boostPack);
        if (!pack || !pack.isActive) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or inactive boost pack");
        }

        const now = new Date();
        payload.boostStartTime = now;
        payload.boostEndTime = new Date(now.getTime() + pack.duration * 24 * 60 * 60 * 1000);
    } else {
        payload.isBoosted = false;
        payload.boostPack = null;
        payload.boostStartTime = null;
        payload.boostEndTime = null;
    }

    const result = await ProductModel.create(payload);
    return result;
};

const getAllProducts = async (query: any, userId?: string) => {
    const { searchTerm, category, subcategory, minPrice, maxPrice, sortBy, order = "desc" } = query;

    const filters: any = { status: "ACTIVE", isDeleted: false };

    if (searchTerm) {
        filters.$or = [{ title: { $regex: searchTerm, $options: "i" } }, { description: { $regex: searchTerm, $options: "i" } }, { address: { $regex: searchTerm, $options: "i" } }];
    }

    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;

    if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = Number(minPrice);
        if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    const pipeline: any[] = [
        { $match: filters },

        // Lookup user with only needed fields
        {
            $lookup: {
                from: "users",
                let: { userId: "$user" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$userId"] },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            photo: 1,
                            role: 1,
                            isActive: 1,
                            verifiedBadge: 1,
                            // Exclude: password, createdAt, updatedAt, lastLogin
                        },
                    },
                ],
                as: "user",
            },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

        // Lookup boost pack with only needed fields
        {
            $lookup: {
                from: "boostpacks",
                let: { packId: "$boostPack" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$packId"] },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            duration: 1,
                            description: 1,
                            type: 1,
                            listingsCount: 1,
                            price: 1,
                            currency: 1,
                        },
                    },
                ],
                as: "boostPack",
            },
        },
        { $unwind: { path: "$boostPack", preserveNullAndEmptyArrays: true } },

        // Determine effective boost status with expiration check
        {
            $addFields: {
                isEffectiveBoosted: {
                    $and: [{ $eq: ["$isBoosted", true] }, { $gt: ["$boostEndTime", new Date()] }],
                },
            },
        },
    ];

    // Add favorite status if userId is provided
    if (userId) {
        pipeline.push({
            $lookup: {
                from: "favorites",
                let: { productId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$user", new mongoose.Types.ObjectId(userId)] }],
                            },
                        },
                    },
                ],
                as: "favoriteData",
            },
        });
        pipeline.push({
            $addFields: {
                isFavorite: { $gt: [{ $size: "$favoriteData" }, 0] },
            },
        });
        pipeline.push({
            $project: { favoriteData: 0 },
        });
    } else {
        pipeline.push({
            $addFields: { isFavorite: false },
        });
    }

    // Sort options
    const sort: any = { isEffectiveBoosted: -1 };
    if (sortBy) {
        sort[sortBy] = order === "desc" ? -1 : 1;
    } else {
        sort.createdAt = -1;
    }

    pipeline.push({ $sort: sort });

    const products = await ProductModel.aggregate(pipeline);
    return products;
};

const getMyProducts = async (userId: string) => {
    const result = await ProductModel.find({ user: userId, isDeleted: false }).populate("boostPack").populate("user", "name email phone photo verifiedBadge").sort({ createdAt: -1 });
    return result;
};

const getProductById = async (id: string, userId?: string) => {
    const result = await ProductModel.findOne({ _id: id, isDeleted: false }).populate("boostPack", "name duration visibility").populate("user", "name email phone photo verifiedBadge").lean();

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    if (userId) {
        const favorite = await FavoriteModel.findOne({ user: userId, product: id });
        (result as any).isFavorite = !!favorite;
    } else {
        (result as any).isFavorite = false;
    }

    return result;
};

const updateProduct = async (id: string, userId: string, payload: Partial<IProduct>) => {
    const product = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

    if (product.user.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized access to update product");
    }

    const result = await ProductModel.findByIdAndUpdate(id, payload, { returnDocument: "after" });
    return result;
};

const updateProductStatus = async (id: string, userId: string, status: string) => {
    const product = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

    if (product.user.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized access to update status");
    }

    product.status = status as any;
    await product.save();
    return product;
};

const boostProduct = async (id: string, userId: string, boostPackId: string) => {
    const product = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

    if (product.user.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized access to boost product");
    }

    const pack = await (BoostPackModel as any).findById(boostPackId);
    if (!pack || !pack.isActive) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or inactive boost pack");
    }

    if (pack.type !== "PRODUCT") {
        throw new ApiError(httpStatus.BAD_REQUEST, "This pack is not for individual product boosting");
    }

    const now = new Date();
    product.isBoosted = true;
    product.boostPack = pack._id;
    product.boostStartTime = now;
    product.boostEndTime = new Date(now.getTime() + pack.duration * 24 * 60 * 60 * 1000);

    await product.save();
    return product;
};

const deleteProduct = async (id: string, userId: string) => {
    const product = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

    if (product.user.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized access to delete product");
    }

    await ProductModel.findByIdAndUpdate(id, { isDeleted: true });
    return { message: "Product deleted successfully" };
};

export const ProductService = {
    createProduct,
    getAllProducts,
    getMyProducts,
    getProductById,
    updateProduct,
    updateProductStatus,
    boostProduct,
    deleteProduct,
};
