import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { FollowService } from "./follow.services";

const toggleFollow = catchAsync(async (req: Request, res: Response) => {
    const followerId = req.user?._id;
    const { followingId } = req.body;

    const result = await FollowService.toggleFollow(followerId as string, followingId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.isFollowing ? "Utilisateur suivi avec succès" : "Abonnement retiré avec succès",
        data: result,
    });
});

const getTopUsers = catchAsync(async (req: Request, res: Response) => {
    const searchTerm = req.query.searchTerm as string;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const currentUserId = req.user?._id;

    const result = await FollowService.getTopUsers({ searchTerm, page, limit, currentUserId });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Meilleurs utilisateurs récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

const getFollowers = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await FollowService.getFollowers(userId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Abonnés récupérés avec succès",
        data: result,
    });
});

const getFollowing = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const result = await FollowService.getFollowing(userId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Abonnements récupérés avec succès",
        data: result,
    });
});

const checkFollowStatus = catchAsync(async (req: Request, res: Response) => {
    const followerId = req.user?._id;
    const { followingId } = req.params;

    const result = await FollowService.checkFollowStatus(followerId as string, followingId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Statut d'abonnement récupéré avec succès",
        data: { isFollowing: result },
    });
});

export const FollowController = {
    toggleFollow,
    getTopUsers,
    getFollowers,
    getFollowing,
    checkFollowStatus,
};
