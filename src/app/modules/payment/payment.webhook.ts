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
import { MessageModel } from "../message/messages.model";
import { UserModel } from "../auth/auth.model";

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
        // 1. Increase the balance of the seller
        if (payment.sellerId) {
            const sellerBalanceIncrease = (payment.buyerFee || 0) + (payment.shippingCost || 0);
            await UserModel.findByIdAndUpdate(payment.sellerId, {
                $inc: { balance: sellerBalanceIncrease },
            });
        }

        // 2. If there is a messageId, mark it as COMPLETED
        if (payment.messageId) {
            await MessageModel.findByIdAndUpdate(payment.messageId, {
                type: "COMPLETED",
            });
        }

        // 3. Create an Order (if not already created)
        const existingOrder = await OrderModel.findOne({ payment: payment._id });
        if (!existingOrder) {
            const orderData: any = {
                buyer: payment.userId,
                seller: payment.sellerId,
                product: payment.productId,
                address: payment.addressId,
                status: "PAID",
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
    }

    return payment;
};

const webhookController = catchAsync(async (req: Request, res: Response) => {
    console.log("Webhook received:", req.body);

    // Paydunya sends fields nested inside a 'data' object in some configurations
    const data = req.body.data || req.body;

    const invoiceToken = data.invoice?.token || data.token || data.invoiceToken;
    const status = data.status;
    const transactionId = data.transaction_id || data.transactionId;
    const receiptUrl = data.receipt_url;

    if (!invoiceToken) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invoice token is required");
    }

    const result = await handleWebhook(invoiceToken, status, transactionId, receiptUrl);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Webhook processed successfully",
        data: result,
    });
});

export const PaymentWebhookService = {
    handleWebhook,
};

export const PaymentWebhookController = {
    webhookController,
};
