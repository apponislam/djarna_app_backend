import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { DashboardServices } from "./dashboard.services";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getDashboardStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard stats retrieved successfully",
        data: result,
    });
});

const getOrdersChartData = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getOrdersChartData();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard chart data retrieved successfully",
        data: result,
    });
});

const getRevenueChartData = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getRevenueChartData();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard revenue chart data retrieved successfully",
        data: result,
    });
});

const getCategoryPerformance = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getCategoryPerformance();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category performance data retrieved successfully",
        data: result,
    });
});

export const DashboardControllers = {
    getDashboardStats,
    getOrdersChartData,
    getRevenueChartData,
    getCategoryPerformance,
};
