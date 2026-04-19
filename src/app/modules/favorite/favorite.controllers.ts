import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { FavoriteService } from "./favorite.services";

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { productId } = req.body;

    const result = await FavoriteService.toggleFavorite(userId, productId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.isFavorited ? "Product added to favorites" : "Product removed from favorites",
        data: result,
    });
});

const getMyFavorites = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await FavoriteService.getMyFavorites(userId, { page, limit });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Favorite products retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

export const FavoriteController = {
    toggleFavorite,
    getMyFavorites,
};
