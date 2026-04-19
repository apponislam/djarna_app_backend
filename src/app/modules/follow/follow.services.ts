import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { FollowModel } from "./follow.model";
import { UserModel } from "../auth/auth.model";

/**
 * Toggle follow/unfollow a user.
 */
const toggleFollow = async (followerId: string, followingId: string) => {
    if (followerId === followingId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You cannot follow yourself!");
    }

    // Check if user to follow exists
    const targetUser = await UserModel.findById(followingId);
    if (!targetUser) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    // Check if already following
    const existingFollow = await FollowModel.findOne({
        follower: followerId,
        following: followingId,
    });

    if (existingFollow) {
        // Unfollow
        await FollowModel.deleteOne({ _id: existingFollow._id });
        return { isFollowing: false };
    } else {
        // Follow
        await FollowModel.create({
            follower: followerId,
            following: followingId,
        });
        return { isFollowing: true };
    }
};

/**
 * Get followers of a user.
 */
const getFollowers = async (userId: string) => {
    const result = await FollowModel.find({ following: userId }).populate("follower", "_id name email phone photo address").lean();
    return result;
};

/**
 * Get users that a user is following.
 */
const getFollowing = async (userId: string) => {
    const result = await FollowModel.find({ follower: userId }).populate("following", "_id name email phone photo address").lean();
    return result;
};

/**
 * Check if a user is following another user.
 */
const checkFollowStatus = async (followerId: string, followingId: string) => {
    const result = await FollowModel.findOne({
        follower: followerId,
        following: followingId,
    });
    return !!result;
};

/**
 * Get top users based on follower count with search and pagination.
 */
const getTopUsers = async (query: { searchTerm?: string; page?: number; limit?: number; currentUserId?: string }) => {
    const { searchTerm, page = 1, limit = 10, currentUserId } = query;
    const skip = (page - 1) * limit;

    const aggregationPipeline: any[] = [
        {
            $group: {
                _id: "$following",
                followerCount: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails",
            },
        },
        { $unwind: "$userDetails" },
    ];

    // Add search filter if searchTerm exists
    if (searchTerm) {
        aggregationPipeline.push({
            $match: {
                "userDetails.name": { $regex: searchTerm, $options: "i" },
            },
        });
    }

    // Sort by followerCount
    aggregationPipeline.push({ $sort: { followerCount: -1 } });

    // Use $facet for pagination and total count
    aggregationPipeline.push({
        $facet: {
            data: [
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: "follows",
                        let: { targetUserId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [{ $eq: ["$follower", new Types.ObjectId(currentUserId)] }, { $eq: ["$following", "$$targetUserId"] }],
                                    },
                                },
                            },
                        ],
                        as: "followingStatus",
                    },
                },
                {
                    $project: {
                        _id: 0,
                        followerCount: 1,
                        isFollowing: {
                            $cond: {
                                if: { $and: [{ $gt: [currentUserId ? 1 : 0, 0] }, { $gt: [{ $size: "$followingStatus" }, 0] }] },
                                then: true,
                                else: false,
                            },
                        },
                        user: {
                            _id: "$userDetails._id",
                            name: "$userDetails.name",
                            photo: "$userDetails.photo",
                            role: "$userDetails.role",
                        },
                    },
                },
            ],
            totalCount: [{ $count: "count" }],
        },
    });

    const result = await FollowModel.aggregate(aggregationPipeline);

    const data = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;
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

export const FollowService = {
    toggleFollow,
    getTopUsers,
    getFollowers,
    getFollowing,
    checkFollowStatus,
};
