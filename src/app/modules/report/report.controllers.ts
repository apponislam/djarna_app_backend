import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ReportService } from "./report.services";
import { Request, Response } from "express";

const createReport = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = req.body;

    const payload = {
        ...body,
        reporter: userId,
    };

    const result = await ReportService.createReport(payload);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Signalement soumis avec succès",
        data: result,
    });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
    const result = await ReportService.getAllReports(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Signalements récupérés avec succès",
        data: result,
    });
});

const getReportById = catchAsync(async (req: Request, res: Response) => {
    const result = await ReportService.getReportById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Détails du signalement récupérés avec succès",
        data: result,
    });
});

const updateReportStatus = catchAsync(async (req: Request, res: Response) => {
    const { status } = req.body;
    const result = await ReportService.updateReportStatus(req.params.id as string, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Statut du signalement mis à jour à ${status === "RESOLVED" ? "résolu" : status === "PENDING" ? "en attente" : "rejeté"}`,
        data: result,
    });
});

export const ReportController = {
    createReport,
    getAllReports,
    getReportById,
    updateReportStatus,
};
