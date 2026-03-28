import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { FollowModel } from "./follow.model";
import { UserModel } from "../auth/auth.model";

/**
 * Follow a user.
 */
const followUser = async (followerId: string, followingId: string) => {
    if (followerId === followingId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You cannot follow yourself!");
    }

    // Check if user to follow exists
    const targetUser = await UserModel.findById(followingId);
    if (!targetUser) {
        throw new ApiError(httpStatus.NOT_FOUND, "User to follow not found!");
    }

    // Check if already following
    const existingFollow = await FollowModel.findOne({
        follower: followerId,
        following: followingId,
    });

    if (existingFollow) {
        throw new ApiError(httpStatus.CONFLICT, "You are already following this user!");
    }

    const result = await FollowModel.create({
        follower: followerId,
        following: followingId,
    });

    return result;
};

/**
 * Unfollow a user.
 */
const unfollowUser = async (followerId: string, followingId: string) => {
    const result = await FollowModel.findOneAndDelete({
        follower: followerId,
        following: followingId,
    });

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "You are not following this user!");
    }

    return result;
};

/**
 * Get followers of a user.
 */
const getFollowers = async (userId: string) => {
    const result = await FollowModel.find({ following: userId })
        .populate("follower", "name email phone profileImage address")
        .lean();
    return result;
};

/**
 * Get users that a user is following.
 */
const getFollowing = async (userId: string) => {
    const result = await FollowModel.find({ follower: userId })
        .populate("following", "name email phone profileImage address")
        .lean();
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

export const FollowService = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowStatus,
};
