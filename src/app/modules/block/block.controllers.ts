import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { BlockService } from "./block.services";

const blockUser = catchAsync(async (req: Request, res: Response) => {
    const blockerId = req.user?._id;
    const { blockedId } = req.body;

    const result = await BlockService.blockUser(blockerId as string, blockedId);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Utilisateur bloqué avec succès",
        data: result,
    });
});

const unblockUser = catchAsync(async (req: Request, res: Response) => {
    const blockerId = req.user?._id;
    const { blockedId } = req.body;

    const result = await BlockService.unblockUser(blockerId as string, blockedId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Utilisateur débloqué avec succès",
        data: result,
    });
});

const getBlockedUsers = catchAsync(async (req: Request, res: Response) => {
    const blockerId = req.user?._id;

    const result = await BlockService.getBlockedUsers(blockerId as string, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Liste des utilisateurs bloqués récupérée avec succès",
        meta: result.meta,
        data: result.data,
    });
});

export const BlockController = {
    blockUser,
    unblockUser,
    getBlockedUsers,
};
