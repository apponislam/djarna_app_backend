import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { CategoryService } from "./category.services";
import { Request, Response } from "express";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    if (req.file) {
        req.body.icon = req.file.path;
    }
    const result = await CategoryService.createCategory(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Category created successfully",
        data: result,
    });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getCategoryById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category retrieved successfully",
        data: result,
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    if (req.file) {
        req.body.icon = req.file.path;
    }
    const result = await CategoryService.updateCategory(req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category updated successfully",
        data: result,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.deleteCategory(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category deleted successfully",
        data: result,
    });
});

const getParentCategories = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getParentCategories();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Parent categories retrieved successfully",
        data: result,
    });
});

const getSubcategoriesByParent = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getSubcategoriesByParent(req.params.parentId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subcategories retrieved successfully",
        data: result,
    });
});

export const CategoryController = {
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getParentCategories,
    getSubcategoriesByParent,
};
