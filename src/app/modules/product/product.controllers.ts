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
        throw new Error("At least one product image is required");
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
        message: "Product created successfully",
        data: result,
    });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ProductService.getAllProducts(req.query, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Products retrieved successfully",
        data: result,
    });
});

const getMyProducts = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ProductService.getMyProducts(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Your products retrieved successfully",
        data: result,
    });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ProductService.getProductById(req.params.id as string, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product details retrieved successfully",
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

    const result = await ProductService.updateProduct(req.params.id as string, userId, payload);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product updated successfully",
        data: result,
    });
});

const updateProductStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { status } = req.body;
    const result = await ProductService.updateProductStatus(req.params.id as string, userId, status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Product marked as ${status}`,
        data: result,
    });
});

const boostProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { boostPlan } = req.body;
    const result = await ProductService.boostProduct(req.params.id as string, userId, boostPlan);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product boosted successfully",
        data: result,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ProductService.deleteProduct(req.params.id as string, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product deleted successfully",
        data: result,
    });
});

export const ProductController = {
    createProduct,
    getAllProducts,
    getMyProducts,
    getProductById,
    updateProduct,
    updateProductStatus,
    boostProduct,
    deleteProduct,
};
