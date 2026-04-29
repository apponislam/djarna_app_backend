import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ProductModel } from "../product/product.model";
import { OrderModel } from "./order.model";
import { DeliveryMethod } from "./order.interface";
import { PaymentService } from "../payment/payment.services";
import { ActivityService } from "../activity/activity.services";

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
        {
            $lookup: {
                from: "addresses",
                localField: "address",
                foreignField: "_id",
                as: "address",
            },
        },
        { $unwind: { path: "$address", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "payments",
                localField: "payment",
                foreignField: "_id",
                as: "payment",
            },
        },
        { $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },
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
                "buyer.resetPasswordOtp": 0,
                "buyer.resetPasswordOtpExpiry": 0,
                "buyer.resetPasswordToken": 0,
                "buyer.resetPasswordTokenExpiry": 0,
                "buyer.phoneVerificationOtp": 0,
                "buyer.phoneVerificationExpiry": 0,
                "buyer.balance": 0,
                "buyer.noCommission": 0,
                "buyer.isActive": 0,
                "buyer.isPhoneVerified": 0,
                "buyer.createdAt": 0,
                "buyer.updatedAt": 0,
                "buyer.lastLogin": 0,
                "buyer.isBoosted": 0,

                "seller.password": 0,
                "seller.resetPasswordOtp": 0,
                "seller.resetPasswordOtpExpiry": 0,
                "seller.resetPasswordToken": 0,
                "seller.resetPasswordTokenExpiry": 0,
                "seller.phoneVerificationOtp": 0,
                "seller.phoneVerificationExpiry": 0,
                "seller.balance": 0,
                "seller.noCommission": 0,
                "seller.isActive": 0,
                "seller.isPhoneVerified": 0,
                "seller.createdAt": 0,
                "seller.updatedAt": 0,
                "seller.lastLogin": 0,
                "seller.isBoosted": 0,
                "seller.boostEndTime": 0,
                "seller.boostPack": 0,
                "seller.boostStartTime": 0,
                "seller.isEmailVerified": 0,

                "product.description": 0,
                "product.originalPrice": 0,
                "product.address": 0,
                "product.gender": 0,
                "product.size": 0,
                "product.brand": 0,
                "product.material": 0,
                "product.user": 0,
                "product.status": 0,
                "product.isBoosted": 0,
                "product.boostPack": 0,
                "product.boostStartTime": 0,
                "product.boostEndTime": 0,
                "product.isDeleted": 0,
                "product.createdAt": 0,
                "product.updatedAt": 0,

                "payment.userId": 0,
                "payment.sellerId": 0,
                "payment.productId": 0,
                "payment.messageId": 0,
                "payment.addressId": 0,
                "payment.productPrice": 0,
                "payment.buyerFee": 0,
                "payment.siteFee": 0,
                "payment.buyerProtectionFee": 0,
                "payment.shippingCost": 0,
                "payment.totalAmount": 0,
                "payment.isDeleted": 0,
                "payment.createdAt": 0,
                "payment.updatedAt": 0,
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
    const order = await OrderModel.findOne({ _id: orderId, isDeleted: false }).populate("product", "title images price category subcategory").populate("buyer", "name photo email phone verifiedBadge role").populate("seller", "name photo email phone verifiedBadge role").populate("address").populate("payment", "paydunyaInvoiceToken paydunyaReceiptUrl paidAt currency status method metadata");

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (order.buyer.toString() !== userId && order.seller.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied");
    }

    return order;
};

const adminGetOrderById = async (orderId: string) => {
    const order = await OrderModel.findOne({ _id: orderId, isDeleted: false }).populate("product", "title images price category subcategory").populate("buyer", "name photo email phone verifiedBadge role").populate("seller", "name photo email phone verifiedBadge role").populate("address").populate("payment", "paydunyaInvoiceToken paydunyaReceiptUrl paidAt currency status method metadata");

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

    // Log activity
    ActivityService.logActivity(userId.toString(), "ORDER_STATUS_UPDATE", `Order status updated to ${status}`, { orderId: order._id, status });

    // If completed, maybe mark product as SOLD?
    if (status === "COMPLETED") {
        await ProductModel.findByIdAndUpdate(order.product, { status: "SOLD" });
    }

    const result = await OrderModel.findById(order._id).populate("product", "title images price category subcategory").populate("buyer", "name photo email phone verifiedBadge role").populate("seller", "name photo email phone verifiedBadge role").populate("address").populate("payment", "paydunyaInvoiceToken paydunyaReceiptUrl paidAt currency status method metadata");

    return result;
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
        {
            $lookup: {
                from: "addresses",
                localField: "address",
                foreignField: "_id",
                as: "address",
            },
        },
        { $unwind: { path: "$address", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "payments",
                localField: "payment",
                foreignField: "_id",
                as: "payment",
            },
        },
        { $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },
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
                "buyer.resetPasswordOtp": 0,
                "buyer.resetPasswordOtpExpiry": 0,
                "buyer.resetPasswordToken": 0,
                "buyer.resetPasswordTokenExpiry": 0,
                "buyer.phoneVerificationOtp": 0,
                "buyer.phoneVerificationExpiry": 0,
                "buyer.balance": 0,
                "buyer.noCommission": 0,
                "buyer.isActive": 0,
                "buyer.isPhoneVerified": 0,
                "buyer.createdAt": 0,
                "buyer.updatedAt": 0,
                "buyer.lastLogin": 0,
                "buyer.isBoosted": 0,

                "seller.password": 0,
                "seller.resetPasswordOtp": 0,
                "seller.resetPasswordOtpExpiry": 0,
                "seller.resetPasswordToken": 0,
                "seller.resetPasswordTokenExpiry": 0,
                "seller.phoneVerificationOtp": 0,
                "seller.phoneVerificationExpiry": 0,
                "seller.balance": 0,
                "seller.noCommission": 0,
                "seller.isActive": 0,
                "seller.isPhoneVerified": 0,
                "seller.createdAt": 0,
                "seller.updatedAt": 0,
                "seller.lastLogin": 0,
                "seller.isBoosted": 0,
                "seller.boostEndTime": 0,
                "seller.boostPack": 0,
                "seller.boostStartTime": 0,
                "seller.isEmailVerified": 0,

                "product.description": 0,
                "product.originalPrice": 0,
                "product.address": 0,
                "product.gender": 0,
                "product.size": 0,
                "product.brand": 0,
                "product.material": 0,
                "product.user": 0,
                "product.status": 0,
                "product.isBoosted": 0,
                "product.boostPack": 0,
                "product.boostStartTime": 0,
                "product.boostEndTime": 0,
                "product.isDeleted": 0,
                "product.createdAt": 0,
                "product.updatedAt": 0,

                "payment.userId": 0,
                "payment.sellerId": 0,
                "payment.productId": 0,
                "payment.messageId": 0,
                "payment.addressId": 0,
                "payment.productPrice": 0,
                "payment.buyerProtectionFee": 0,
                "payment.shippingCost": 0,
                "payment.totalAmount": 0,
                "payment.isDeleted": 0,
                "payment.createdAt": 0,
                "payment.updatedAt": 0,
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
