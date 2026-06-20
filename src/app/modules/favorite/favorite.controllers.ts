import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { FavoriteService } from "./favorite.services";

const toggleFavorite = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { productId } = req.body;

    const result = await FavoriteService.toggleFavorite(userId as string, productId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.isFavorited ? "Produit ajouté aux favoris" : "Produit retiré des favoris",
        data: result,
    });
});

const getMyFavorites = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await FavoriteService.getMyFavorites(userId as string, { page, limit });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Produits favoris récupérés avec succès",
        meta: result.meta,
        data: result.data,
    });
});

export const FavoriteController = {
    toggleFavorite,
    getMyFavorites,
};
