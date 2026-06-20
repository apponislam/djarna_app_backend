import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { SettingsService } from "./settings.services";

const getSettings = catchAsync(async (req: Request, res: Response) => {
    const result = await SettingsService.getSettings();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Paramètres récupérés avec succès",
        data: result,
    });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
    const result = await SettingsService.updateSettings(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Paramètres mis à jour avec succès",
        data: result,
    });
});

export const SettingsController = {
    getSettings,
    updateSettings,
};
