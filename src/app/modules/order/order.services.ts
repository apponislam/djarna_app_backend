import httpStatus from "http-status";
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

const getMyOrders = async (userId: string, role: "buyer" | "seller") => {
    const filter: any = { isDeleted: false };
    if (role === "buyer") filter.buyer = userId;
    else filter.seller = userId;

    return await OrderModel.find(filter).populate("product", "title images price").populate("buyer", "name photo verifiedBadge").populate("seller", "name photo verifiedBadge").sort({ createdAt: -1 });
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
    if (status === "PAID" || status === "COMPLETED") {
        await ProductModel.findByIdAndUpdate(order.product, { status: "SOLD" });
    }

    return order;
};

export const OrderService = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
};
