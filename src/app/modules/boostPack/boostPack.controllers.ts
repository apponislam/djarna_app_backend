import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { BoostPackService } from "./boostPack.services";
import { Request, Response } from "express";

const createBoostPack = catchAsync(async (req: Request, res: Response) => {
    const result = await BoostPackService.createBoostPack(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Pack de boost créé avec succès",
        data: result,
    });
});

const getAllBoostPacks = catchAsync(async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === "ADMIN";
    const type = req.query.type as string;
    const result = await BoostPackService.getAllBoostPacks(isAdmin, type);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Packs de boost récupérés avec succès",
        data: result,
    });
});

const getBoostPackById = catchAsync(async (req: Request, res: Response) => {
    const result = await BoostPackService.getBoostPackById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Détails du pack de boost récupérés avec succès",
        data: result,
    });
});

const updateBoostPack = catchAsync(async (req: Request, res: Response) => {
    const result = await BoostPackService.updateBoostPack(req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Pack de boost mis à jour avec succès",
        data: result,
    });
});

const deleteBoostPack = catchAsync(async (req: Request, res: Response) => {
    const result = await BoostPackService.deleteBoostPack(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Pack de boost supprimé avec succès",
        data: result,
    });
});

const toggleBoostPackStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await BoostPackService.toggleBoostPackStatus(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Pack de boost marqué comme ${result.isActive ? "Actif" : "Désactivé"}`,
        data: result,
    });
});

const setRecommended = catchAsync(async (req: Request, res: Response) => {
    const result = await BoostPackService.setRecommended(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Pack de boost ${result.isRecommended ? "défini comme recommandé" : "retiré des recommandations"} avec succès`,
        data: result,
    });
});

export const BoostPackController = {
    createBoostPack,
    getAllBoostPacks,
    getBoostPackById,
    updateBoostPack,
    deleteBoostPack,
    toggleBoostPackStatus,
    setRecommended,
};
