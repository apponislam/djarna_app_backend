import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ProductModel } from "../product/product.model";
import { OrderModel } from "./order.model";
import { IOrder, DeliveryMethod } from "./order.interface";
import { PaymentService } from "../payment/payment.services";
import { SettingsModel } from "../settings/settings.model";
import { Types } from "mongoose";

const calculateFees = async (productPrice: number, deliveryMethod: DeliveryMethod) => {
    const settings = await SettingsModel.findOne();
    const siteFeePercentage = settings?.payment?.commissionRate || 8;
    const buyerFee = settings?.payment?.buyerFee || 0.95;

    const siteFee = (productPrice * siteFeePercentage) / 100;

    let shippingCost = 0;

    switch (deliveryMethod) {
        case "HOME_DELIVERY":
            shippingCost = 3.75;
            break;
        case "PICKUP_POINT":
            shippingCost = 2.5;
            break;
        case "MEET_UP":
            shippingCost = 0;
            break;
    }

    const totalAmount = productPrice + buyerFee + shippingCost;

    return {
        productPrice,
        buyerFee,
        siteFee,
        shippingCost,
        totalAmount,
    };
};

const createOrder = async (buyerId: string, payload: { productId: string; deliveryMethod: DeliveryMethod; shippingAddress?: any }) => {
    const product = await ProductModel.findOne({ _id: payload.productId, isDeleted: false, status: "ACTIVE" });
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found or not available");
    }

    if (product.user.toString() === buyerId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You cannot buy your own product");
    }

    const priceSummaryResult = await calculateFees(product.price, payload.deliveryMethod);

    const orderData: Partial<IOrder> = {
        buyer: new Types.ObjectId(buyerId),
        seller: product.user,
        product: product._id,
        deliveryMethod: payload.deliveryMethod,
        shippingAddress: payload.shippingAddress,
        priceSummary: {
            productPrice: priceSummaryResult.productPrice,
            buyerProtectionFee: priceSummaryResult.buyerFee,
            shippingCost: priceSummaryResult.shippingCost,
            siteFee: priceSummaryResult.siteFee,
            totalAmount: priceSummaryResult.totalAmount,
        },
        status: "PENDING",
    };

    const order = await OrderModel.create(orderData);

    // Initialize Payment
    const paymentInitialization = await PaymentService.initializePayment({
        userId: buyerId,
        amount: priceSummaryResult.totalAmount,
        productPrice: priceSummaryResult.productPrice,
        buyerFee: priceSummaryResult.buyerFee,
        siteFee: priceSummaryResult.siteFee,
        shippingFee: priceSummaryResult.shippingCost,
        currency: "EUR", // User example used Euro
        description: `Order for ${product.title}`,
        metadata: {
            orderId: order._id,
            type: "PRODUCT_ORDER",
        },
    });

    // Link payment to order
    order.payment = (paymentInitialization.payment as any)._id;
    await order.save();

    return {
        order,
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
