import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ActivityService } from "./activity.services";

const getAllActivities = catchAsync(async (req: Request, res: Response) => {
    const result = await ActivityService.getAllActivities(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Activities retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

export const ActivityController = {
    getAllActivities,
};
