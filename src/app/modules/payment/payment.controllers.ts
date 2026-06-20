import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { PaymentService } from "./payment.services";
import { Request, Response } from "express";

const initializePayment = catchAsync(async (req: Request, res: Response) => {
    // console.log("initializePayment", req.body);
    const result = await PaymentService.initializePayment({
        userId: req.user!._id,
        sellerId: req.body.sellerId,
        productId: req.body.productId,
        messageId: req.body.messageId,
        addressId: req.body.addressId,
        productPrice: req.body.productPrice,
        buyerProtectionFee: req.body.buyerProtectionFee,
        shippingCost: req.body.shippingCost,
        currency: req.body.currency,
        description: req.body.description,
        method: req.body.method,
        metadata: req.body.metadata,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Paiement initialisé avec succès",
        data: result,
    });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
    const { invoiceToken } = req.query;
    const result = await PaymentService.verifyPayment(invoiceToken as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Paiement vérifié avec succès",
        data: result,
    });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.getPaymentById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Paiement récupéré avec succès",
        data: result,
    });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
    const { status, method, startDate, endDate, page, limit } = req.query;
    const filters: any = {};
    if (status) filters.status = status;
    if (method) filters.method = method;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await PaymentService.getUserPayments(req.user!._id, filters);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Mes paiements récupérés avec succès",
        data: result,
    });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
    const { userId, status, method, startDate, endDate, page, limit } = req.query;
    const filters: any = {};
    if (userId) filters.userId = userId as string;
    if (status) filters.status = status;
    if (method) filters.method = method;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (page) filters.page = Number(page);
    if (limit) filters.limit = Number(limit);

    const result = await PaymentService.getAllPayments(filters);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Tous les paiements récupérés avec succès",
        data: result.data,
        meta: result.meta,
    });
});

const refundPayment = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.refundPayment(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Paiement remboursé avec succès",
        data: result,
    });
});

export const PaymentController = {
    initializePayment,
    verifyPayment,
    getPaymentById,
    getMyPayments,
    getAllPayments,
    refundPayment,
};
