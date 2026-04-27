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
        message: "Withdrawal request submitted successfully",
        data: result,
    });
});

const getMyWithdrawals = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const result = await WithdrawService.getMyWithdrawals(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Withdrawals retrieved successfully",
        data: result,
    });
});

const getAllWithdrawals = catchAsync(async (req: Request, res: Response) => {
    const result = await WithdrawService.getAllWithdrawals(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All withdrawals retrieved successfully",
        data: result,
    });
});

export const WithdrawController = {
    requestWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
};
