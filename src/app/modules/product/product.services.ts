import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ProductModel } from "./product.model";
import { IProduct } from "./product.interface";
import { BoostPackModel } from "../boostPack/boostPack.model";
import mongoose from "mongoose";
import { FavoriteModel } from "../favorite/favorite.model";
import { ActivityService } from "../activity/activity.services";

const createProduct = async (payload: IProduct) => {
    // If the product is being boosted during creation
    if (payload.isBoosted && payload.boostPack) {
        const pack = await BoostPackModel.findById(payload.boostPack);
        if (!pack || !pack.isActive) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Pack de boost invalide ou inactif");
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

    // Log activity
    ActivityService.logActivity(payload.user.toString(), "PRODUCT_CREATE", `Listed new product: ${payload.title}`, { productId: result._id });

    return result;
};

const getAllProducts = async (query: any, userId?: string) => {
    const { page = 1, limit = 10, searchTerm, category, subcategory, subSubcategory, subSubSubcategory, minPrice, maxPrice, sortBy, order = "desc" } = query;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const filters: any = { status: "ACTIVE", isDeleted: false };

    if (searchTerm) {
        filters.$or = [{ title: { $regex: searchTerm, $options: "i" } }, { description: { $regex: searchTerm, $options: "i" } }, { address: { $regex: searchTerm, $options: "i" } }];
    }

    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;
    if (subSubcategory) filters.subSubcategory = subSubcategory;
    if (subSubSubcategory) filters.subSubSubcategory = subSubSubcategory;

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
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNumber });

    const products = await ProductModel.aggregate(pipeline);
    const total = await ProductModel.countDocuments(filters);

    const totalPages = Math.ceil(total / limitNumber);
    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: products,
    };
};

const getMyProducts = async (userId: string, query: Record<string, any> = {}) => {
    const { page = 1, limit = 10 } = query;
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const filters = { user: userId, isDeleted: false };

    const result = await ProductModel.find(filters)
        .populate("boostPack")
        .populate("user", "name email phone photo verifiedBadge")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await ProductModel.countDocuments(filters);

    const totalPages = Math.ceil(total / limitNumber);
    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: result,
    };
};

const getProductById = async (id: string, userId?: string) => {
    const result = await ProductModel.findOne({ _id: id, isDeleted: false }).populate("boostPack", "name duration visibility").populate("user", "name email phone photo verifiedBadge").lean();

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Produit introuvable");
    }

    if (userId) {
        const favorite = await FavoriteModel.findOne({ user: userId, product: id });
        (result as any).isFavorite = !!favorite;
    } else {
        (result as any).isFavorite = false;
    }

    return result;
};

const getProductsByUserId = async (targetUserId: string, currentUserId?: string, query: Record<string, any> = {}) => {
    const { page = 1, limit = 10 } = query;
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const filters: any = { user: targetUserId, status: "ACTIVE", isDeleted: false };

    const pipeline: any[] = [
        { $match: filters },
        // Lookup user with only needed fields
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $project: {
                "user.password": 0,
                "user.resetPasswordOtp": 0,
                "user.resetPasswordOtpExpiry": 0,
                "user.resetPasswordToken": 0,
                "user.resetPasswordTokenExpiry": 0,
                "user.phoneVerificationOtp": 0,
                "user.phoneVerificationExpiry": 0,
            },
        },
    ];

    // Add favorite status if currentUserId is provided
    if (currentUserId) {
        pipeline.push({
            $lookup: {
                from: "favorites",
                let: { productId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$user", new mongoose.Types.ObjectId(currentUserId)] }],
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

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNumber });

    const products = await ProductModel.aggregate(pipeline);
    const total = await ProductModel.countDocuments(filters);

    const totalPages = Math.ceil(total / limitNumber);
    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: products,
    };
};

const updateProduct = async (id: string, userId: string, payload: Partial<IProduct>) => {
    const product = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Produit introuvable");

    if (product.user.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Accès non autorisé pour mettre à jour le produit");
    }

    const result = await ProductModel.findByIdAndUpdate(id, payload, { returnDocument: "after" });

    // Log activity
    ActivityService.logActivity(userId.toString(), "PRODUCT_UPDATE", `Updated product details: ${result?.title}`, { productId: id });

    return result;
};

const updateProductStatus = async (id: string, userId: string, status: string) => {
    const product = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Produit introuvable");

    if (product.user.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Accès non autorisé pour mettre à jour le statut");
    }

    product.status = status as any;
    await product.save();

    // Log activity
    ActivityService.logActivity(userId.toString(), "PRODUCT_UPDATE", `Changed product status to ${status}: ${product.title}`, { productId: id, status });

    return product;
};

const boostProduct = async (id: string, userId: string, boostPackId: string) => {
    const product = await ProductModel.findOne({ _id: id, isDeleted: false });
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Produit introuvable");

    if (product.user.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Accès non autorisé pour booster le produit");
    }

    const pack = await (BoostPackModel as any).findById(boostPackId);
    if (!pack || !pack.isActive) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Pack de boost invalide ou inactif");
    }

    if (pack.type !== "PRODUCT") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Ce pack n'est pas destiné au boost de produit individuel");
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
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Produit introuvable");

    if (product.user.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "Accès non autorisé pour supprimer le produit");
    }

    await ProductModel.findByIdAndUpdate(id, { isDeleted: true });
    return { message: "Produit supprimé avec succès" };
};

export const ProductService = {
    createProduct,
    getAllProducts,
    getMyProducts,
    getProductsByUserId,
    getProductById,
    updateProduct,
    updateProductStatus,
    boostProduct,
    deleteProduct,
};
