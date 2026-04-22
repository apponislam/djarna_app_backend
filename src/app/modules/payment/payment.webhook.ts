import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { PaymentModel } from "./payment.model";
import { IPayment } from "./payment.interface";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { BoostPaymentModel } from "../boostPayment/boostPayment.model";
import { BoostPaymentService } from "../boostPayment/boostPayment.services";

const handleWebhook = async (invoiceToken: string, status: string, transactionId?: string): Promise<any> => {
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

    return payment;
};

const webhookController = catchAsync(async (req: Request, res: Response) => {
    // Paydunya sends fields in different formats depending on the setup
    // Common fields: token (or invoiceToken), status, transaction_id (or transactionId)
    const invoiceToken = req.body.token || req.body.invoiceToken;
    const status = req.body.status;
    const transactionId = req.body.transaction_id || req.body.transactionId;

    if (!invoiceToken) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invoice token is required");
    }

    const result = await handleWebhook(invoiceToken, status, transactionId);

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
