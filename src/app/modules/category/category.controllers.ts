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
    const { searchTerm } = req.query;
    const result = await CategoryService.getParentCategories(searchTerm as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Parent categories (Level 1) retrieved successfully",
        data: result,
    });
});

const getSubcategoriesByParent = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getSubcategoriesByParent(req.params.parentId as string, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subcategories retrieved successfully",
        data: result,
    });
});

const getAllSubcategories = catchAsync(async (req: Request, res: Response) => {
    const { searchTerm } = req.query;
    const result = await CategoryService.getAllSubcategories(searchTerm as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All subcategories (Level > 1) retrieved successfully",
        data: result,
    });
});

const getCategoriesByLevel = catchAsync(async (req: Request, res: Response) => {
    const level = parseInt(req.params.level as string, 10);
    const { searchTerm } = req.query;
    const result = await CategoryService.getCategoriesByLevel(level, searchTerm as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Categories at level ${level} retrieved successfully`,
        data: result,
    });
});

const getCategoryTree = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getCategoryTree(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Full hierarchical category tree retrieved successfully",
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
    getAllSubcategories,
    getCategoriesByLevel,
    getCategoryTree,
};
