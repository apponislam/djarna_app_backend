import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";
import { OrderModel } from "../order/order.model";
import { PaymentModel } from "../payment/payment.model";
import { DisputeModel } from "./dispute.model";
import { IDispute } from "./dispute.interface";
import { ActivityService } from "../activity/activity.services";
import { PaymentService } from "../payment/payment.services";
import { NotificationUtils } from "../../../utils/notification";
import { UserModel } from "../auth/auth.model";

/**
 * Create a new dispute
 */
const createDispute = async (buyerId: string, payload: Partial<IDispute>) => {
    const order = await OrderModel.findById(payload.order);
    if (!order) throw new ApiError(httpStatus.NOT_FOUND, "Order not found");

    if (order.buyer.toString() !== buyerId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Only the buyer can open a dispute");
    }

    const payment = await PaymentModel.findById(payload.payment);
    if (!payment) throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");

    const disputeData = {
        ...payload,
        buyer: buyerId,
        seller: order.seller,
        status: "PENDING",
    };

    const result = await DisputeModel.create(disputeData);

    // Log activity (Admin)
    ActivityService.logActivity(buyerId, "DISPUTE_CREATED", `Dispute opened for order #${order._id}`, { disputeId: result._id, orderId: order._id });

    // Notify Seller about Dispute
    const seller = await UserModel.findById(order.seller);
    if (seller?.fcmTokens && seller.fcmTokens.length > 0) {
        await NotificationUtils.sendPushNotification(seller.fcmTokens, "Dispute Opened", `A dispute has been opened for your order #${order._id}.`);
    }

    return result;
};

/**
 * Get all disputes (Admin)
 */
const getAllDisputes = async (query: Record<string, any>) => {
    const { page = 1, limit = 10, status, searchTerm } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (status) filter.status = status;

    if (searchTerm) {
        filter.$or = [{ description: { $regex: searchTerm, $options: "i" } }, { reason: { $regex: searchTerm, $options: "i" } }];
    }

    const total = await DisputeModel.countDocuments(filter);
    const data = await DisputeModel.find(filter).populate("buyer", "name email phone photo").populate("seller", "name email phone photo").populate("order").populate("payment").sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        data,
    };
};

/**
 * Get dispute by ID
 */
const getDisputeById = async (id: string) => {
    const result = await DisputeModel.findById(id).populate("buyer", "name email phone photo").populate("seller", "name email phone photo").populate("order").populate("payment");

    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Dispute not found");
    return result;
};

/**
 * Resolve a dispute (Admin)
 */
const resolveDispute = async (id: string, adminId: string, resolution: "RESOLVED" | "REJECTED", adminNote: string, refundAmount?: number) => {
    const dispute = await DisputeModel.findById(id);
    if (!dispute) throw new ApiError(httpStatus.NOT_FOUND, "Dispute not found");

    if (dispute.status !== "PENDING" && dispute.status !== "IN_REVIEW") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Dispute is already closed");
    }

    dispute.status = resolution;
    dispute.adminNote = adminNote;
    dispute.resolvedAt = new Date();

    if (resolution === "RESOLVED" && refundAmount && refundAmount > 0) {
        // Trigger refund via PayDunya
        await PaymentService.refundPayment(dispute.payment.toString(), refundAmount);
        dispute.refundAmount = refundAmount;

        // Log activity for refund (Admin)
        ActivityService.logActivity(adminId, "REFUND_PROCESSED", `Refund of ${refundAmount} processed for dispute #${dispute._id}`, { disputeId: dispute._id, amount: refundAmount });

        // Notify Buyer about Refund
        const buyer = await UserModel.findById(dispute.buyer);
        if (buyer?.fcmTokens && buyer.fcmTokens.length > 0) {
            await NotificationUtils.sendPushNotification(buyer.fcmTokens, "Refund Processed", `A refund of ${refundAmount} FCFA has been processed for your dispute.`);
        }
    } else if (resolution === "REJECTED") {
        // Notify Buyer about Rejection
        const buyer = await UserModel.findById(dispute.buyer);
        if (buyer?.fcmTokens && buyer.fcmTokens.length > 0) {
            await NotificationUtils.sendPushNotification(buyer.fcmTokens, "Dispute Rejected", `Your dispute for order #${dispute.order} has been rejected by the admin.`);
        }
    }

    await dispute.save();

    // Log activity for resolution (Admin)
    ActivityService.logActivity(adminId, "DISPUTE_RESOLVED", `Dispute #${dispute._id} marked as ${resolution}`, { disputeId: dispute._id, resolution });

    return dispute;
};

export const DisputeService = {
    createDispute,
    getAllDisputes,
    getDisputeById,
    resolveDispute,
};
