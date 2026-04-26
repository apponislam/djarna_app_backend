import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { ProductModel } from "../product/product.model";
import { FollowModel } from "../follow/follow.model";
import { Types } from "mongoose";

const getPopularUsers = async (currentUserId?: string, query: Record<string, any> = {}) => {
    const { searchTerm, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { isActive: true };

    if (searchTerm) {
        filter.$or = [{ name: { $regex: searchTerm, $options: "i" } }, { email: { $regex: searchTerm, $options: "i" } }, { phone: { $regex: searchTerm, $options: "i" } }];
    }

    const aggregationPipeline: any[] = [
        // Match active users and apply search filter
        { $match: filter },
        // Look up follower count from follows collection
        {
            $lookup: {
                from: "follows",
                localField: "_id",
                foreignField: "following",
                as: "followers",
            },
        },
        {
            $addFields: {
                followerCount: { $size: "$followers" },
            },
        },
        // Look up published product count
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "user",
                as: "products",
                pipeline: [{ $match: { isDeleted: false, status: "ACTIVE" } }],
            },
        },
        {
            $addFields: {
                publishedProductCount: { $size: "$products" },
            },
        },
        // Check if current user is following
        {
            $addFields: {
                isFollowing: {
                    $cond: {
                        if: {
                            $and: [
                                { $ne: [currentUserId, undefined] },
                                {
                                    $in: [currentUserId ? new Types.ObjectId(currentUserId) : null, "$followers.follower"],
                                },
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        // Sort by followerCount descending
        { $sort: { followerCount: -1 } },
        // Pagination
        { $skip: skip },
        { $limit: Number(limit) },
        // Project needed fields
        {
            $project: {
                password: 0,
                resetPasswordOtp: 0,
                resetPasswordOtpExpiry: 0,
                resetPasswordToken: 0,
                resetPasswordTokenExpiry: 0,
                phoneVerificationOtp: 0,
                phoneVerificationExpiry: 0,
                products: 0,
                followers: 0,
            },
        },
    ];

    const popularUsers = await UserModel.aggregate(aggregationPipeline);
    const total = await UserModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        data: popularUsers,
    };
};

const getAllUsers = async (query: Record<string, any>) => {
    const { searchTerm, verifiedBadge, isActive, page = 1, limit = 10 } = query;
    const filter: any = {};

    if (searchTerm) {
        filter.$or = [{ name: { $regex: searchTerm, $options: "i" } }, { email: { $regex: searchTerm, $options: "i" } }, { phone: { $regex: searchTerm, $options: "i" } }];
    }

    if (verifiedBadge !== undefined) {
        filter.verifiedBadge = verifiedBadge === "true";
    }

    if (isActive !== undefined) {
        filter.isActive = isActive === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await UserModel.aggregate([
        { $match: filter },
        { $skip: skip },
        { $limit: Number(limit) },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "user",
                as: "products",
                pipeline: [{ $match: { isDeleted: false, status: "ACTIVE" } }],
            },
        },
        {
            $addFields: {
                publishedProductCount: { $size: "$products" },
            },
        },
        {
            $project: {
                password: 0,
                resetPasswordOtp: 0,
                resetPasswordOtpExpiry: 0,
                resetPasswordToken: 0,
                resetPasswordTokenExpiry: 0,
                phoneVerificationOtp: 0,
                phoneVerificationExpiry: 0,
                products: 0,
            },
        },
    ]);

    const total = await UserModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        data: users,
    };
};

const getSingleUser = async (id: string) => {
    const user = await UserModel.aggregate([
        { $match: { _id: new (require("mongoose").Types.ObjectId)(id) } },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "user",
                as: "products",
                pipeline: [{ $match: { isDeleted: false, status: "ACTIVE" } }],
            },
        },
        {
            $addFields: {
                publishedProductCount: { $size: "$products" },
            },
        },
        {
            $project: {
                password: 0,
                resetPasswordOtp: 0,
                resetPasswordOtpExpiry: 0,
                resetPasswordToken: 0,
                resetPasswordTokenExpiry: 0,
                phoneVerificationOtp: 0,
                phoneVerificationExpiry: 0,
                products: 0,
            },
        },
    ]);

    if (!user || user.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    return user[0];
};

const getUserStats = async () => {
    const totalUsers = await UserModel.countDocuments();
    const activeUsers = await UserModel.countDocuments({ isActive: true });
    const suspendedUsers = await UserModel.countDocuments({ isActive: false });
    const verifiedUsers = await UserModel.countDocuments({ verifiedBadge: true });

    return {
        totalUsers,
        activeUsers,
        suspendedUsers,
        verifiedUsers,
    };
};

export const UserServices = {
    getPopularUsers,
    getAllUsers,
    getSingleUser,
    getUserStats,
};
