import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserServices } from "./user.services";

const getPopularUsers = catchAsync(async (req: Request, res: Response) => {
    const currentUserId = req.user?._id;
    const result = await UserServices.getPopularUsers(currentUserId, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Utilisateurs populaires récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await UserServices.getAllUsers(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Utilisateurs récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserServices.getSingleUser(id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Utilisateur récupéré avec succès",
        data: result,
    });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
    const result = await UserServices.getUserStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Statistiques des utilisateurs récupérées avec succès",
        data: result,
    });
});

const toggleUserActive = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserServices.toggleUserActive(id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Utilisateur ${result.isActive ? "activé" : "désactivé"} avec succès`,
        data: result,
    });
});

const removeVerifiedBadge = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserServices.removeVerifiedBadge(id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Badge vérifié supprimé avec succès",
        data: result,
    });
});

export const UserControllers = {
    getPopularUsers,
    getAllUsers,
    getSingleUser,
    getUserStats,
    toggleUserActive,
    removeVerifiedBadge,
};
