import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { FollowService } from "./follow.services";

const followUser = catchAsync(async (req: Request, res: Response) => {
    const followerId = req.user?._id;
    const { followingId } = req.body;

    const result = await FollowService.followUser(followerId, followingId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User followed successfully",
        data: result,
    });
});

const unfollowUser = catchAsync(async (req: Request, res: Response) => {
    const followerId = req.user?._id;
    const { followingId } = req.params;

    const result = await FollowService.unfollowUser(followerId, followingId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User unfollowed successfully",
        data: result,
    });
});

const getFollowers = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await FollowService.getFollowers(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Followers retrieved successfully",
        data: result,
    });
});

const getFollowing = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await FollowService.getFollowing(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Following users retrieved successfully",
        data: result,
    });
});

const checkFollowStatus = catchAsync(async (req: Request, res: Response) => {
    const followerId = req.user?._id;
    const { followingId } = req.params;

    const result = await FollowService.checkFollowStatus(followerId, followingId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Follow status retrieved successfully",
        data: { isFollowing: result },
    });
});

export const FollowController = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowStatus,
};
