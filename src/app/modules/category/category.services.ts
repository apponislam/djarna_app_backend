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

const getParentCategories = async (searchTerm?: string) => {
    const query: any = { parentCategory: null };

    if (searchTerm) {
        query.name = { $regex: searchTerm, $options: "i" };
    }

    const categories = await CategoryModel.find(query).sort({ homePosition: 1 }).lean();

    // Process subcategoryCount for each parent category
    const result = await Promise.all(
        categories.map(async (category) => {
            const subcategoryCount = await CategoryModel.countDocuments({ parentCategory: category._id });
            return {
                ...category,
                subcategoryCount,
            };
        }),
    );

    return result;
};

const getSubcategoriesByParent = async (parentId: string, query: any = {}) => {
    const filters: any = { parentCategory: parentId };

    // Apply gender filter (supports single string or array)
    if (query.gender) {
        const genders = Array.isArray(query.gender) ? query.gender : [query.gender];
        filters.gender = { $in: genders };
    }

    // Apply active status filter
    if (query.isActive !== undefined) {
        filters.isActive = query.isActive === "true";
    }

    // Apply home visibility filter
    if (query.homeVisibility !== undefined) {
        filters.homeVisibility = query.homeVisibility === "true";
    }

    // Apply search term filter for subcategories
    if (query.searchTerm) {
        filters.name = { $regex: query.searchTerm, $options: "i" };
    }

    const subcategories = await CategoryModel.find(filters).sort({ homePosition: 1 }).populate("parentCategory", "name").lean();

    // Add listingCount placeholder for now (as there's no Listing model yet)
    const result = subcategories.map((sub) => ({
        ...sub,
        listingCount: Math.floor(Math.random() * 200) + 50, // Static count for dashboard demo
    }));

    return result;
};

const getAllSubcategories = async (searchTerm?: string) => {
    const query: any = { parentCategory: { $ne: null } };

    if (searchTerm) {
        query.name = { $regex: searchTerm, $options: "i" };
    }

    const subcategories = await CategoryModel.find(query).populate("parentCategory", "name").lean();

    // Add listingCount placeholder for now
    const result = subcategories.map((sub) => ({
        ...sub,
        listingCount: Math.floor(Math.random() * 200) + 50, // Static count for dashboard demo
    }));

    return result;
};

export const CategoryService = {
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getParentCategories,
    getSubcategoriesByParent,
    getAllSubcategories,
};
