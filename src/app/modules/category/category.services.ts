import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { CategoryModel } from "./category.model";
import { ICategory } from "./category.interface";

const createCategory = async (payload: ICategory) => {
    const isExist = await CategoryModel.findOne({ name: payload.name });
    if (isExist) {
        throw new ApiError(httpStatus.CONFLICT, "Category already exists!");
    }
    const result = await CategoryModel.create(payload);
    return result;
};

const getAllCategories = async () => {
    // Return hierarchical structure for all categories
    const categories = await CategoryModel.find({ parentCategory: null }).lean();

    // Process subcategories for each parent category
    const result = await Promise.all(
        categories.map(async (category) => {
            const subcategories = await CategoryModel.find({ parentCategory: category._id }).lean();
            return {
                ...category,
                subcategoryCount: subcategories.length,
                subcategories,
            };
        }),
    );

    return result;
};

const getCategoryById = async (id: string) => {
    const category = await CategoryModel.findById(id).lean();
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found!");
    }

    const subcategories = await CategoryModel.find({ parentCategory: id }).lean();
    return {
        ...category,
        subcategories,
        subcategoryCount: subcategories.length,
    };
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
    const isExist = await CategoryModel.findById(id);
    if (!isExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found!");
    }

    const result = await CategoryModel.findByIdAndUpdate(id, payload, { new: true });
    return result;
};

const deleteCategory = async (id: string) => {
    const isExist = await CategoryModel.findById(id);
    if (!isExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found!");
    }

    // Check if it has subcategories before deleting (or you could cascade delete)
    const subcategories = await CategoryModel.find({ parentCategory: id });
    if (subcategories.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot delete category with subcategories!");
    }

    const result = await CategoryModel.findByIdAndDelete(id);
    return result;
};

const getHomeVisibleCategories = async () => {
    const result = await CategoryModel.find({ homeVisibility: true }).sort({ homePosition: 1 }).lean();
    return result;
};

export const CategoryService = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getHomeVisibleCategories,
};
