import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ProductModel } from "./product.model";
import { IProduct, BoostPlan } from "./product.interface";

const calculateBoostEndTime = (plan: BoostPlan) => {
    const now = new Date();
    if (plan === "7-DAY") return new Date(now.setDate(now.getDate() + 7));
    if (plan === "14-DAY") return new Date(now.setDate(now.getDate() + 14));
    if (plan === "30-DAY") return new Date(now.setDate(now.getDate() + 30));
    return null;
};

const createProduct = async (payload: IProduct) => {
    // If the product is being boosted during creation
    if (payload.isBoosted && payload.boostPlan) {
        payload.boostStartTime = new Date();
        payload.boostEndTime = calculateBoostEndTime(payload.boostPlan);
    } else {
        payload.isBoosted = false;
        payload.boostPlan = null;
        payload.boostStartTime = null;
        payload.boostEndTime = null;
    }

    const result = await ProductModel.create(payload);
    return result;
};

const getAllProducts = async (query: any) => {
    const { searchTerm, category, subcategory, minPrice, maxPrice, sortBy, order = "desc" } = query;

    const filters: any = { status: "ACTIVE" };

    if (searchTerm) {
        filters.$or = [
            { title: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
        ];
    }

    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;
    if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = Number(minPrice);
        if (maxPrice) filters.price.$lte = Number(maxPrice);
    }

    // Sort: Always prioritize active boosted items, then apply user sorting or default to createdAt
    const sortOptions: any = { isBoosted: -1 };
    if (sortBy) {
        sortOptions[sortBy] = order === "desc" ? -1 : 1;
    } else {
        sortOptions.createdAt = -1;
    }

    const result = await ProductModel.find(filters)
        .populate("category", "name icon")
        .populate("subcategory", "name icon")
        .populate("user", "name email phone")
        .sort(sortOptions);

    return result;
};

const getProductById = async (id: string) => {
    const result = await ProductModel.findById(id)
        .populate("category", "name icon")
        .populate("subcategory", "name icon")
        .populate("user", "name email phone");

    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    return result;
};

const updateProductStatus = async (id: string, userId: string, status: string) => {
    const product = await ProductModel.findById(id);
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

    if (product.user.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized access to update status");
    }

    product.status = status as any;
    await product.save();
    return product;
};

const boostProduct = async (id: string, userId: string, plan: BoostPlan) => {
    const product = await ProductModel.findById(id);
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

    if (product.user.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized access to boost product");
    }

    product.isBoosted = true;
    product.boostPlan = plan;
    product.boostStartTime = new Date();
    product.boostEndTime = calculateBoostEndTime(plan);

    await product.save();
    return product;
};

const deleteProduct = async (id: string, userId: string) => {
    const product = await ProductModel.findById(id);
    if (!product) throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

    if (product.user.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized access to delete product");
    }

    await ProductModel.findByIdAndDelete(id);
    return { message: "Product deleted successfully" };
};

export const ProductService = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProductStatus,
    boostProduct,
    deleteProduct,
};
