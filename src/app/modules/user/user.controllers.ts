import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { UserServices } from "./user.services";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await UserServices.getAllUsers(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Users retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserServices.getSingleUser(id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
    const result = await UserServices.getUserStats();
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User statistics retrieved successfully",
        data: result,
    });
});

export const UserControllers = {
    getAllUsers,
    getSingleUser,
    getUserStats,
};
