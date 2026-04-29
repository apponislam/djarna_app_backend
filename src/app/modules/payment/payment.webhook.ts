import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { PaymentModel } from "./payment.model";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { BoostPaymentModel } from "../boostPayment/boostPayment.model";
import { BoostPaymentService } from "../boostPayment/boostPayment.services";
import { OrderModel } from "../order/order.model";
import { ProductModel } from "../product/product.model";
import { UserModel } from "../auth/auth.model";
import { messageServices } from "../message/messages.services";
import { WithdrawModel } from "../withdraw/withdraw.model";
import { ActivityService } from "../activity/activity.services";

const handleWithdrawWebhook = async (disbursementToken: string, status: string, failReason?: string) => {
    const withdraw = await WithdrawModel.findOne({ paydunyaDisbursementToken: disbursementToken });
    if (!withdraw) return null;

    if (status === "success" || status === "completed") {
        withdraw.status = "COMPLETED";
        // Log activity
        ActivityService.logActivity(withdraw.userId.toString(), "WITHDRAWAL_REQUEST", `Withdrawal of ${withdraw.amount} successful`, { withdrawalId: withdraw._id });
    } else if (status === "failed") {
        withdraw.status = "FAILED";
        withdraw.failReason = failReason || "Withdrawal failed at provider";

        // Log activity
        ActivityService.logActivity(withdraw.userId.toString(), "WITHDRAWAL_REQUEST", `Withdrawal of ${withdraw.amount} failed: ${withdraw.failReason}`, { withdrawalId: withdraw._id });

        // Refund the user balance if it was deducted
        await UserModel.findByIdAndUpdate(withdraw.userId, {
            $inc: { balance: withdraw.amount },
        });
    }

    await withdraw.save();
    return withdraw;
};

const handleWebhook = async (invoiceToken: string, status: string, transactionId?: string, receiptUrl?: string): Promise<any> => {
    // 1. Try to find in standard PaymentModel
    let payment: any = await PaymentModel.findOne({ paydunyaInvoiceToken: invoiceToken });
    let isBoostPayment = false;

    // 2. If not found, try to find in BoostPaymentModel
    if (!payment) {
        payment = await BoostPaymentModel.findOne({ paydunyaInvoiceToken: invoiceToken });
        isBoostPayment = true;
    }

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment record not found");
    }

    if (receiptUrl) {
        payment.paydunyaReceiptUrl = receiptUrl;
    }

    switch (status) {
        case "completed":
            payment.status = "COMPLETED";
            payment.paidAt = new Date();
            if (transactionId) {
                payment.transactionId = transactionId;
            }
            break;
        case "failed":
            payment.status = "FAILED";
            break;
        case "cancelled":
            payment.status = "CANCELLED";
            break;
        default:
            payment.status = "PENDING";
    }

    await payment.save();

    // 3. If it's a completed boost payment, apply boost effects
    if (isBoostPayment && status === "completed") {
        await BoostPaymentService.applyBoostEffects(payment._id.toString());
    }

    // 4. If it's a completed product order payment, handle business logic
    if (!isBoostPayment && status === "completed") {
        // 1. Update seller balance and commission usage
        if (payment.sellerId) {
            const sellerBalanceIncrease = (payment.buyerFee || 0) + (payment.shippingCost || 0);
            const updateData: any = { $inc: { balance: sellerBalanceIncrease } };

            // If this was a zero-commission payment, decrement the seller's noCommission count
            if (payment.siteFee === 0 && (payment.productPrice || 0) > 0) {
                updateData.$inc.noCommission = -1;
            }

            await UserModel.findByIdAndUpdate(payment.sellerId, updateData);
        }

        // 2. If there is a messageId, mark it as COMPLETED and sync via socket
        if (payment.messageId) {
            await messageServices.markMessageAsCompleted(payment.messageId.toString());
        }

        // 3. Create an Order (if not already created)
        const existingOrder = await OrderModel.findOne({ payment: payment._id });
        if (!existingOrder) {
            const orderData: any = {
                buyer: payment.userId,
                seller: payment.sellerId,
                product: payment.productId,
                address: payment.addressId,
                status: "PENDING",
                productPrice: payment.productPrice,
                buyerProtectionFee: payment.buyerProtectionFee,
                shippingCost: payment.shippingCost,
                siteFee: payment.siteFee,
                buyerFee: payment.buyerFee,
                totalAmount: payment.totalAmount,
                payment: payment._id,
                deliveryMethod: payment.metadata?.deliveryMethod || "HOME_DELIVERY",
            };

            await OrderModel.create(orderData);
        }

        // 4. Mark Product as SOLD
        await ProductModel.findByIdAndUpdate(payment.productId, {
            status: "SOLD",
        });

        // 5. Log Activity
        ActivityService.logActivity(payment.userId.toString(), "PAYMENT_COMPLETED", `Payment of ${payment.totalAmount} completed for product order`, { paymentId: payment._id });
        ActivityService.logActivity(payment.userId.toString(), "ORDER_PLACED", "Order placed successfully", { paymentId: payment._id });
    }

    return payment;
};

const webhookController = catchAsync(async (req: Request, res: Response) => {
    console.log("Webhook received:", JSON.stringify(req.body, null, 2));

    const data = req.body.data || req.body;

    // Check if it's a disbursement/withdrawal notification
    const disbursementToken = data.disburse_token || data.token;
    const isDisbursement = data.disburse_token || (data.invoice === undefined && data.token && !data.invoiceToken);

    if (isDisbursement && disbursementToken) {
        const status = data.status;
        const failReason = data.response_text || data.fail_reason;
        const result = await handleWithdrawWebhook(disbursementToken, status, failReason);

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Withdrawal webhook processed",
            data: result,
        });
    }

    // Otherwise treat as a standard payment notification
    const invoiceToken = data.invoice?.token || data.token || data.invoiceToken;
    const status = data.status;
    const transactionId = data.transaction_id || data.transactionId;
    const receiptUrl = data.receipt_url;

    if (!invoiceToken) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invoice or Disbursement token is required");
    }

    const result = await handleWebhook(invoiceToken, status, transactionId, receiptUrl);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment webhook processed successfully",
        data: result,
    });
});

export const PaymentWebhookService = {
    handleWebhook,
};

export const PaymentWebhookController = {
    webhookController,
};
