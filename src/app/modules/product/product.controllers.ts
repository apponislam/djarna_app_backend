import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ProductService } from "./product.services";
import { Request, Response } from "express";

const createProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = req.body;

    // Handle multiple image uploads from multer
    const files = req.files as Express.Multer.File[];
    const imagePaths = files?.map((file) => file.path) || [];

    if (imagePaths.length === 0) {
        throw new Error("Au moins une image du produit est requise");
    }

    const payload = {
        ...body,
        user: userId,
        images: imagePaths,
    };

    const result = await ProductService.createProduct(payload);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Produit créé avec succès",
        data: result,
    });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ProductService.getAllProducts(req.query, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Produits récupérés avec succès",
        data: result,
    });
});

const getMyProducts = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ProductService.getMyProducts(userId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Vos produits récupérés avec succès",
        data: result,
    });
});

const getProductsByUserId = catchAsync(async (req: Request, res: Response) => {
    const currentUserId = req.user?._id;
    const targetUserId = req.params.userId;
    const result = await ProductService.getProductsByUserId(targetUserId as string, currentUserId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Produits de l'utilisateur récupérés avec succès",
        data: result,
    });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ProductService.getProductById(req.params.id as string, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Détails du produit récupérés avec succès",
        data: result,
    });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = req.body;

    // Handle multiple image uploads from multer if provided
    const files = req.files as Express.Multer.File[];
    const imagePaths = files?.map((file) => file.path);

    const payload = {
        ...body,
    };

    if (imagePaths && imagePaths.length > 0) {
        payload.images = imagePaths;
    }

    const result = await ProductService.updateProduct(req.params.id as string, userId as string, payload);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Produit mis à jour avec succès",
        data: result,
    });
});

const updateProductStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { status } = req.body;
    const result = await ProductService.updateProductStatus(req.params.id as string, userId as string, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Produit marqué comme ${status === "SOLD" ? "vendu" : status === "ACTIVE" ? "actif" : "inactif"}`,
        data: result,
    });
});

const boostProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { boostPlan } = req.body;
    const result = await ProductService.boostProduct(req.params.id as string, userId as string, boostPlan);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Produit boosté avec succès",
        data: result,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ProductService.deleteProduct(req.params.id as string, userId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Produit supprimé avec succès",
        data: result,
    });
});

export const ProductController = {
    createProduct,
    getAllProducts,
    getMyProducts,
    getProductsByUserId,
    getProductById,
    updateProduct,
    updateProductStatus,
    boostProduct,
    deleteProduct,
};
