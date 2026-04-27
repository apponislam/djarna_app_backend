import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ProductModel } from "../product/product.model";
import { OrderModel } from "./order.model";
import { DeliveryMethod } from "./order.interface";
import { PaymentService } from "../payment/payment.services";

const createOrder = async (
    buyerId: string,
    payload: {
        productId: string;
        deliveryMethod: DeliveryMethod;
        address?: string;
        productPrice: number;
        buyerProtectionFee: number;
        shippingCost: number;
    },
) => {
    const product = await ProductModel.findOne({ _id: payload.productId, isDeleted: false, status: "ACTIVE" });
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found or not available");
    }

    if (product.user.toString() === buyerId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You cannot buy your own product");
    }

    // Initialize Payment ONLY - DO NOT create order yet
    const paymentInitialization = await PaymentService.initializePayment({
        userId: buyerId,
        sellerId: product.user.toString(),
        productId: product._id.toString(),
        addressId: payload.address,
        productPrice: payload.productPrice,
        buyerProtectionFee: payload.buyerProtectionFee,
        shippingCost: payload.shippingCost,
        currency: "FCFA",
        description: `Payment for ${product.title}`,
        metadata: {
            type: "PRODUCT_ORDER",
            deliveryMethod: payload.deliveryMethod,
        },
    });

    return {
        payment: paymentInitialization,
    };
};

const getMyOrders = async (userId: string, role: "buyer" | "seller", query: Record<string, any>) => {
    const { page = 1, limit = 10, searchTerm } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const matchStage: any = { isDeleted: false };
    if (role === "buyer") matchStage.buyer = new mongoose.Types.ObjectId(userId);
    else matchStage.seller = new mongoose.Types.ObjectId(userId);

    const pipeline: any[] = [
        { $match: matchStage },
        {
            $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "product",
            },
        },
        { $unwind: "$product" },
        {
            $lookup: {
                from: "users",
                localField: "buyer",
                foreignField: "_id",
                as: "buyer",
            },
        },
        { $unwind: "$buyer" },
        {
            $lookup: {
                from: "users",
                localField: "seller",
                foreignField: "_id",
                as: "seller",
            },
        },
        { $unwind: "$seller" },
    ];

    if (searchTerm) {
        pipeline.push({
            $match: {
                $or: [{ "product.title": { $regex: searchTerm, $options: "i" } }, { "buyer.name": { $regex: searchTerm, $options: "i" } }, { "seller.name": { $regex: searchTerm, $options: "i" } }],
            },
        });
    }

    const totalPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await OrderModel.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
        {
            $project: {
                "buyer.password": 0,
                "seller.password": 0,
            },
        },
    );

    const orders = await OrderModel.aggregate(pipeline);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        data: orders,
    };
};

const getOrderById = async (orderId: string, userId: string) => {
    const order = await OrderModel.findOne({ _id: orderId, isDeleted: false }).populate("product").populate("buyer", "name photo email phone verifiedBadge").populate("seller", "name photo email phone verifiedBadge").populate("payment");

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (order.buyer.toString() !== userId && order.seller.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied");
    }

    return order;
};

const adminGetOrderById = async (orderId: string) => {
    const order = await OrderModel.findOne({ _id: orderId, isDeleted: false }).populate("product").populate("buyer", "name photo email phone verifiedBadge").populate("seller", "name photo email phone verifiedBadge").populate("payment");

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

const updateOrderStatus = async (orderId: string, userId: string, status: string) => {
    const order = await OrderModel.findOne({ _id: orderId, isDeleted: false });
    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    // Permission logic:
    // Seller can mark as SHIPPED
    // Buyer can mark as COMPLETED (after delivery)
    // Admin can do anything (role check omitted here for simplicity)

    if (status === "SHIPPED" && order.seller.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Only seller can mark order as shipped");
    }

    if (status === "COMPLETED" && order.buyer.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Only buyer can mark order as completed");
    }

    order.status = status as any;
    await order.save();

    // If completed, maybe mark product as SOLD?
    if (status === "COMPLETED") {
        await ProductModel.findByIdAndUpdate(order.product, { status: "SOLD" });
    }

    return order;
};

const adminGetAllOrders = async (query: Record<string, any>) => {
    const { page = 1, limit = 10, status, searchTerm } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const matchStage: any = { isDeleted: false };
    if (status) {
        matchStage.status = status;
    }

    const pipeline: any[] = [
        { $match: matchStage },
        {
            $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "product",
            },
        },
        { $unwind: "$product" },
        {
            $lookup: {
                from: "users",
                localField: "buyer",
                foreignField: "_id",
                as: "buyer",
            },
        },
        { $unwind: "$buyer" },
        {
            $lookup: {
                from: "users",
                localField: "seller",
                foreignField: "_id",
                as: "seller",
            },
        },
        { $unwind: "$seller" },
    ];

    if (searchTerm) {
        pipeline.push({
            $match: {
                $or: [{ "product.title": { $regex: searchTerm, $options: "i" } }, { "buyer.name": { $regex: searchTerm, $options: "i" } }, { "seller.name": { $regex: searchTerm, $options: "i" } }],
            },
        });
    }

    const totalPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await OrderModel.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
        {
            $project: {
                "buyer.password": 0,
                "seller.password": 0,
            },
        },
    );

    const orders = await OrderModel.aggregate(pipeline);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        data: orders,
    };
};

const adminGetOrderStats = async () => {
    const pending = await OrderModel.countDocuments({ status: "PENDING", isDeleted: false });
    const shipped = await OrderModel.countDocuments({ status: "SHIPPED", isDeleted: false });
    const delivered = await OrderModel.countDocuments({ status: "DELIVERED", isDeleted: false });
    const completed = await OrderModel.countDocuments({ status: "COMPLETED", isDeleted: false });

    return {
        pending,
        shipped,
        delivered,
        completed,
    };
};

export const OrderService = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    adminGetAllOrders,
    adminGetOrderById,
    adminGetOrderStats,
};
