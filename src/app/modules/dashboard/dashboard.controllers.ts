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
        message: "Statistiques du tableau de bord récupérées avec succès",
        data: result,
    });
});

const getOrdersChartData = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getOrdersChartData();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Données de graphique du tableau de bord récupérées avec succès",
        data: result,
    });
});

const getRevenueChartData = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getRevenueChartData();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Données de graphique des revenus du tableau de bord récupérées avec succès",
        data: result,
    });
});

const getCategoryPerformance = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getCategoryPerformance();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Données de performance des catégories récupérées avec succès",
        data: result,
    });
});

const getCommissionStats = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getCommissionStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Statistiques des commissions et des séquestres récupérées avec succès",
        data: result,
    });
});

const getThisMonthStats = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardServices.getThisMonthStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Statistiques du mois en cours récupérées avec succès",
        data: result,
    });
});

export const DashboardControllers = {
    getDashboardStats,
    getOrdersChartData,
    getRevenueChartData,
    getCategoryPerformance,
    getCommissionStats,
    getThisMonthStats,
};
