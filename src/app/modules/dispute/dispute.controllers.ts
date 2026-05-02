import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { DisputeService } from "./dispute.services";

const createDispute = catchAsync(async (req: Request, res: Response) => {
    const buyerId = req.user._id;
    const body = req.body;

    // Handle multiple image uploads
    if (req.files && Array.isArray(req.files)) {
        body.images = (req.files as Express.Multer.File[]).map((file) => file.path);
    }

    const result = await DisputeService.createDispute(buyerId, body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Dispute opened successfully",
        data: result,
    });
});

const getAllDisputes = catchAsync(async (req: Request, res: Response) => {
    const result = await DisputeService.getAllDisputes(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Disputes retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getDisputeById = catchAsync(async (req: Request, res: Response) => {
    const result = await DisputeService.getDisputeById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dispute retrieved successfully",
        data: result,
    });
});

const resolveDispute = catchAsync(async (req: Request, res: Response) => {
    const adminId = req.user._id;
    const { resolution, adminNote, refundAmount } = req.body;
    const result = await DisputeService.resolveDispute(req.params.id as string, adminId, resolution, adminNote, refundAmount);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Dispute resolved as ${resolution}`,
        data: result,
    });
});

export const DisputeController = {
    createDispute,
    getAllDisputes,
    getDisputeById,
    resolveDispute,
};
