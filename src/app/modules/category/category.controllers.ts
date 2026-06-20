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
        message: "Catégorie créée avec succès",
        data: result,
    });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getCategoryById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Catégorie récupérée avec succès",
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
        message: "Catégorie mise à jour avec succès",
        data: result,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.deleteCategory(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Catégorie supprimée avec succès",
        data: result,
    });
});

const getParentCategories = catchAsync(async (req: Request, res: Response) => {
    const { searchTerm } = req.query;
    const result = await CategoryService.getParentCategories(searchTerm as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Catégories parentes (Niveau 1) récupérées avec succès",
        data: result,
    });
});

const getSubcategoriesByParent = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getSubcategoriesByParent(req.params.parentId as string, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Sous-catégories récupérées avec succès",
        data: result,
    });
});

const getAllSubcategories = catchAsync(async (req: Request, res: Response) => {
    const { searchTerm } = req.query;
    const result = await CategoryService.getAllSubcategories(searchTerm as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Toutes les sous-catégories (Niveau > 1) récupérées avec succès",
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
        message: `Catégories de niveau ${level} récupérées avec succès`,
        data: result,
    });
});

const getCategoryTree = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getCategoryTree(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Arborescence complète des catégories récupérée avec succès",
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
