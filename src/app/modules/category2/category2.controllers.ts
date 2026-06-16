import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Category2Service } from "./category2.services";
import { Request, Response } from "express";

const createCategory = catchAsync(async (req: Request, res: Response) => {
    if (req.file) {
        req.body.icon = req.file.path;
    }
    const result = await Category2Service.createCategory(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Category2 created successfully",
        data: result,
    });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
    const result = await Category2Service.getCategoryById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category2 retrieved successfully",
        data: result,
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    if (req.file) {
        req.body.icon = req.file.path;
    }
    const result = await Category2Service.updateCategory(req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category2 updated successfully",
        data: result,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await Category2Service.deleteCategory(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category2 deleted successfully",
        data: result,
    });
});

const getParentCategories = catchAsync(async (req: Request, res: Response) => {
    const { searchTerm } = req.query;
    const result = await Category2Service.getParentCategories(searchTerm as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Parent categories (Level 1) retrieved successfully",
        data: result,
    });
});

const getSubcategoriesByParent = catchAsync(async (req: Request, res: Response) => {
    const result = await Category2Service.getSubcategoriesByParent(req.params.parentId as string, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subcategories retrieved successfully",
        data: result,
    });
});

const getAllSubcategories = catchAsync(async (req: Request, res: Response) => {
    const { searchTerm } = req.query;
    const result = await Category2Service.getAllSubcategories(searchTerm as string);

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
    const result = await Category2Service.getCategoriesByLevel(level, searchTerm as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `Categories at level ${level} retrieved successfully`,
        data: result,
    });
});

const getCategoryTree = catchAsync(async (req: Request, res: Response) => {
    const result = await Category2Service.getCategoryTree(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Full hierarchical category tree retrieved successfully",
        data: result,
    });
});

export const Category2Controller = {
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
