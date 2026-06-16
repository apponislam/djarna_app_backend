import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { CategoryModel } from "./category.model";
import { ProductModel } from "../product/product.model";
import { ICategory } from "./category.interface";
import { Types } from "mongoose";

// Helper to check for cycles: is parentId a descendant of childId?
const isDescendant = async (parentId: string, childId: string): Promise<boolean> => {
    if (parentId === childId) return true;
    const parent = await CategoryModel.findById(parentId).lean();
    if (!parent || !parent.parentCategory) return false;
    return isDescendant(parent.parentCategory.toString(), childId);
};

// Helper to get max level in subtree recursively
const getMaxLevelInSubtree = async (categoryId: string, currentMax: number): Promise<number> => {
    const children = await CategoryModel.find({ parentCategory: categoryId }).lean();
    let maxLvl = currentMax;
    for (const child of children) {
        maxLvl = Math.max(maxLvl, child.level);
        const childMax = await getMaxLevelInSubtree(child._id.toString(), child.level);
        maxLvl = Math.max(maxLvl, childMax);
    }
    return maxLvl;
};

// Helper to update descendant levels recursively
const updateDescendantLevels = async (parentId: string, levelOffset: number) => {
    const children = await CategoryModel.find({ parentCategory: parentId });
    for (const child of children) {
        const newLevel = child.level + levelOffset;
        await CategoryModel.findByIdAndUpdate(child._id, { level: newLevel });
        await updateDescendantLevels(child._id.toString(), levelOffset);
    }
};

// Helper to get breadcrumbs path
const getBreadcrumbs = async (categoryId: string): Promise<any[]> => {
    const path: any[] = [];
    let current = await CategoryModel.findById(categoryId).lean();
    while (current) {
        path.unshift({
            _id: current._id,
            name: current.name,
            level: current.level,
        });
        if (current.parentCategory) {
            current = await CategoryModel.findById(current.parentCategory).lean();
        } else {
            break;
        }
    }
    return path;
};

const recursiveParentPopulate = {
    path: "parentCategory",
    select: "name parentCategory level",
    populate: {
        path: "parentCategory",
        select: "name parentCategory level",
        populate: {
            path: "parentCategory",
            select: "name level"
        }
    }
};

const createCategory = async (payload: ICategory) => {
    // Determine level based on parentCategory
    let calculatedLevel = 1;
    if (payload.parentCategory) {
        const parent = await CategoryModel.findById(payload.parentCategory);
        if (!parent) {
            throw new ApiError(httpStatus.NOT_FOUND, "Parent category not found!");
        }
        if (parent.level >= 4) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Cannot create a category below level 4!");
        }
        calculatedLevel = parent.level + 1;
    }

    // Check unique category name under the same parent
    const isExist = await CategoryModel.findOne({
        parentCategory: payload.parentCategory || null,
        name: payload.name,
    });
    if (isExist) {
        throw new ApiError(httpStatus.CONFLICT, `Category "${payload.name}" already exists under this parent!`);
    }

    if (payload.homePosition !== null && payload.homePosition !== undefined) {
        const positionExists = await CategoryModel.findOne({ homePosition: payload.homePosition });
        if (positionExists) {
            throw new ApiError(httpStatus.CONFLICT, `Home position ${payload.homePosition} is already in use!`);
        }
    }

    const categoryData = {
        ...payload,
        level: calculatedLevel,
    };

    const result = await CategoryModel.create(categoryData);
    return result;
};

const getCategoryById = async (id: string) => {
    const category = await CategoryModel.findById(id).lean();
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found!");
    }

    const subcategories = await CategoryModel.find({ parentCategory: id }).lean();
    const breadcrumbs = await getBreadcrumbs(id);

    return {
        ...category,
        breadcrumbs,
        subcategories,
        subcategoryCount: subcategories.length,
    };
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
    const category = await CategoryModel.findById(id);
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found!");
    }

    const currentParentId = category.parentCategory ? category.parentCategory.toString() : null;
    const newParentId = payload.parentCategory !== undefined ? (payload.parentCategory ? payload.parentCategory.toString() : null) : currentParentId;

    let newLevel = category.level;
    let levelOffset = 0;

    // If parent is changing, validate constraints
    if (payload.parentCategory !== undefined && newParentId !== currentParentId) {
        if (newParentId) {
            // Check for circular dependency
            if (newParentId === id) {
                throw new ApiError(httpStatus.BAD_REQUEST, "A category cannot be its own parent!");
            }
            const circular = await isDescendant(newParentId, id);
            if (circular) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Circular reference detected: Parent category cannot be a descendant of this category!");
            }

            const parent = await CategoryModel.findById(newParentId);
            if (!parent) {
                throw new ApiError(httpStatus.NOT_FOUND, "Parent category not found!");
            }

            newLevel = parent.level + 1;
        } else {
            newLevel = 1;
        }

        levelOffset = newLevel - category.level;

        // Check if updating this level exceeds depth limit of 4 for any descendants
        const maxDescendantLevel = await getMaxLevelInSubtree(id, category.level);
        if (maxDescendantLevel + levelOffset > 4) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Changing parent would exceed the maximum depth limit of 4 levels!`);
        }
    }

    // Check unique category name under the (potentially new) parent
    if (payload.name || payload.parentCategory !== undefined) {
        const checkName = payload.name || category.name;
        const parentToCheck = newParentId;

        const isExist = await CategoryModel.findOne({
            parentCategory: parentToCheck || null,
            name: checkName,
            _id: { $ne: id },
        });
        if (isExist) {
            throw new ApiError(httpStatus.CONFLICT, `Category "${checkName}" already exists under this parent!`);
        }
    }

    if (payload.homePosition !== null && payload.homePosition !== undefined) {
        const positionExists = await CategoryModel.findOne({
            homePosition: payload.homePosition,
            _id: { $ne: id },
        });
        if (positionExists) {
            throw new ApiError(httpStatus.CONFLICT, `Home position ${payload.homePosition} is already in use!`);
        }
    }

    const updateData = {
        ...payload,
        level: newLevel,
    };

    const result = await CategoryModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" });

    // Update descendants levels if there was a level shift
    if (levelOffset !== 0) {
        await updateDescendantLevels(id, levelOffset);
    }

    return result;
};

const deleteCategory = async (id: string) => {
    const isExist = await CategoryModel.findById(id);
    if (!isExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found!");
    }

    // Check if it has subcategories before deleting
    const subcategories = await CategoryModel.find({ parentCategory: id });
    if (subcategories.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Cannot delete category with subcategories!");
    }

    const result = await CategoryModel.findByIdAndDelete(id);
    return result;
};

const getParentCategories = async (searchTerm?: string) => {
    const query: any = { level: 1 }; // Level 1 is the root parent category

    if (searchTerm) {
        query.name = { $regex: searchTerm, $options: "i" };
    }

    const categories = await CategoryModel.find(query).sort({ homePosition: 1, name: 1 }).lean();

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

    if (query.isActive !== undefined) {
        filters.isActive = query.isActive === "true";
    }

    if (query.homeVisibility !== undefined) {
        filters.homeVisibility = query.homeVisibility === "true";
    }

    if (query.searchTerm) {
        filters.name = { $regex: query.searchTerm, $options: "i" };
    }

    const subcategories = await CategoryModel.find(filters).sort({ homePosition: 1, name: 1 }).populate(recursiveParentPopulate).lean();

    const result = await Promise.all(
        subcategories.map(async (sub) => {
            const subcategoryCount = await CategoryModel.countDocuments({ parentCategory: sub._id });
            const listingCount = await ProductModel.countDocuments({
                $or: [
                    { category: sub.name },
                    { subcategory: sub.name },
                    { subSubcategory: sub.name },
                    { subSubSubcategory: sub.name },
                ],
                status: "ACTIVE",
                isDeleted: false,
            });
            return {
                ...sub,
                subcategoryCount,
                listingCount,
            };
        })
    );

    return result;
};

const getAllSubcategories = async (searchTerm?: string) => {
    const query: any = { level: { $gt: 1 } }; // Level 2, 3, and 4 are subcategories

    if (searchTerm) {
        query.name = { $regex: searchTerm, $options: "i" };
    }

    const subcategories = await CategoryModel.find(query).populate(recursiveParentPopulate).lean();

    const result = await Promise.all(
        subcategories.map(async (sub) => {
            const subcategoryCount = await CategoryModel.countDocuments({ parentCategory: sub._id });
            const listingCount = await ProductModel.countDocuments({
                $or: [
                    { category: sub.name },
                    { subcategory: sub.name },
                    { subSubcategory: sub.name },
                    { subSubSubcategory: sub.name },
                ],
                status: "ACTIVE",
                isDeleted: false,
            });
            return {
                ...sub,
                subcategoryCount,
                listingCount,
            };
        })
    );

    return result;
};

const getCategoriesByLevel = async (level: number, searchTerm?: string) => {
    if (level < 1 || level > 4) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Level must be between 1 and 4!");
    }

    const query: any = { level };
    if (searchTerm) {
        query.name = { $regex: searchTerm, $options: "i" };
    }

    const categories = await CategoryModel.find(query).sort({ homePosition: 1, name: 1 }).populate(recursiveParentPopulate).lean();
    return categories;
};

const getCategoryTree = async (query: any = {}) => {
    const filter: any = {};
    if (query.isActive !== undefined) {
        filter.isActive = query.isActive === "true";
    }

    const allCategories = await CategoryModel.find(filter).sort({ homePosition: 1, name: 1 }).lean();

    // Map categories by ID
    const categoryMap: Record<string, any> = {};
    allCategories.forEach((cat) => {
        categoryMap[cat._id.toString()] = {
            ...cat,
            children: [],
        };
    });

    const tree: any[] = [];

    allCategories.forEach((cat) => {
        const mappedCat = categoryMap[cat._id.toString()];
        if (cat.parentCategory) {
            const parent = categoryMap[cat.parentCategory.toString()];
            if (parent) {
                parent.children.push(mappedCat);
            } else {
                // If parent isn't loaded (e.g. because of active filter), place it at the root of the visible tree
                tree.push(mappedCat);
            }
        } else {
            tree.push(mappedCat);
        }
    });

    // Clean up tree to only return top-level elements that are at Level 1 (if level filter isn't broken)
    return tree.filter((cat) => !cat.parentCategory || !categoryMap[cat.parentCategory.toString()]);
};

export const CategoryService = {
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
