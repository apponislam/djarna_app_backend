import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { BoostPaymentService } from "./boostPayment.services";
import { Request, Response } from "express";

const initializeBoostPayment = catchAsync(async (req: Request, res: Response) => {
    const { productId, boostPackId } = req.body;
    const userId = req.user?._id;

    const result = await BoostPaymentService.initializeBoostPayment(userId as string, boostPackId, productId);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Paiement du boost initialisé avec succès",
        data: result,
    });
});

const verifyBoostPayment = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await BoostPaymentService.verifyBoostPayment(token);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Paiement du boost vérifié avec succès",
        data: result,
    });
});

const getMyBoostPayments = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await BoostPaymentService.getMyBoostPayments(userId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Paiements du boost récupérés avec succès",
        data: result,
    });
});

export const BoostPaymentController = {
    initializeBoostPayment,
    verifyBoostPayment,
    getMyBoostPayments,
};
