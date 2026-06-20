import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { DisputeService } from "./dispute.services";

const createDispute = catchAsync(async (req: Request, res: Response) => {
    const buyerId = req.user!._id;
    const body = req.body;

    // Handle multiple image uploads
    if (req.files && Array.isArray(req.files)) {
        body.images = (req.files as Express.Multer.File[]).map((file) => file.path);
    }

    const result = await DisputeService.createDispute(buyerId, body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Litige ouvert avec succès",
        data: result,
    });
});

const getAllDisputes = catchAsync(async (req: Request, res: Response) => {
    const result = await DisputeService.getAllDisputes(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Litiges récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

const getDisputeById = catchAsync(async (req: Request, res: Response) => {
    const result = await DisputeService.getDisputeById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Litige récupéré avec succès",
        data: result,
    });
});

const resolveDispute = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.user!._id;
    const { resolution, adminNote, refundAmount } = req.body;
    const result = await DisputeService.resolveDispute(req.params.id as string, adminId, resolution, adminNote, refundAmount);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Litige résolu comme : ${resolution}`,
        data: result,
    });
});

const getDisputeStats = catchAsync(async (req: Request, res: Response) => {
    const result = await DisputeService.getDisputeStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Statistiques des litiges récupérées avec succès",
        data: result,
    });
});

const cancelDispute = catchAsync(async (req: Request, res: Response) => {
    const buyerId = req.user!._id;
    const disputeId = req.params.id as string;
    const result = await DisputeService.cancelDispute(disputeId, buyerId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Litige annulé avec succès",
        data: result,
    });
});

const getMyDisputes = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const result = await DisputeService.getMyDisputes(userId, req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Mes litiges récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

const getDisputeByOrderId = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const orderId = req.params.orderId as string;
    const result = await DisputeService.getDisputeByOrderId(orderId, userId);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Litige récupéré avec succès",
        data: result,
    });
});

export const DisputeController = {
    createDispute,
    getAllDisputes,
    getMyDisputes,
    getDisputeById,
    getDisputeByOrderId,
    resolveDispute,
    cancelDispute,
    getDisputeStats,
};
