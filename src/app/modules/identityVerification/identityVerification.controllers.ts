import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { IdentityVerificationService } from "./identityVerification.services";

const submitVerification = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const payload = {
        documentType: req.body.documentType,
        frontImage: files?.frontImage?.[0]?.path,
        backImage: files?.backImage?.[0]?.path,
        selfieImage: files?.selfieImage?.[0]?.path,
    };

    if (!payload.frontImage || !payload.selfieImage) {
        throw new Error("Front image and selfie are required");
    }

    const result = await IdentityVerificationService.submitVerification(userId, payload);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verification request submitted successfully",
        data: result,
    });
});

const getMyVerificationStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await IdentityVerificationService.getMyVerificationStatus(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verification status retrieved successfully",
        data: result,
    });
});

const getAllVerificationRequests = catchAsync(async (req: Request, res: Response) => {
    const result = await IdentityVerificationService.getAllVerificationRequests(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Verification requests retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const updateVerificationStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    const result = await IdentityVerificationService.updateVerificationStatus(id as string, status, adminComment);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Verification request ${status.toLowerCase()} successfully`,
        data: result,
    });
});

export const IdentityVerificationController = {
    submitVerification,
    getMyVerificationStatus,
    getAllVerificationRequests,
    updateVerificationStatus,
};
