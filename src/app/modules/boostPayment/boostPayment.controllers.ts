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

const getAllBoostPayments = catchAsync(async (req: Request, res: Response) => {
    const { userId, status, type, startDate, endDate, page, limit } = req.query;
    const filters: any = {};
    if (userId) filters.userId = userId as string;
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await BoostPaymentService.getAllBoostPayments(filters);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Tous les paiements de boost récupérés avec succès",
        data: result.data,
        meta: result.meta,
    });
});

const getSingleBoostPayment = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const result = await BoostPaymentService.getSingleBoostPayment(id as string, userId as string, userRole as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Paiement de boost récupéré avec succès",
        data: result,
    });
});

export const BoostPaymentController = {
    initializeBoostPayment,
    verifyBoostPayment,
    getMyBoostPayments,
    getAllBoostPayments,
    getSingleBoostPayment,
};

