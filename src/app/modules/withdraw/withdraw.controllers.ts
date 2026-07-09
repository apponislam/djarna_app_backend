import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { WithdrawService } from "./withdraw.services";

const requestWithdrawal = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const result = await WithdrawService.requestWithdrawal(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Demande de retrait soumise avec succès",
        data: result,
    });
});

const getMyWithdrawals = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await WithdrawService.getMyWithdrawals(userId, { page, limit });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Retraits récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

const getAllWithdrawals = catchAsync(async (req: Request, res: Response) => {
    const result = await WithdrawService.getAllWithdrawals(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Tous les retraits récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

export const WithdrawController = {
    requestWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
};
