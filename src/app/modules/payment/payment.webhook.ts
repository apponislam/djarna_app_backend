import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { PaymentModel } from "./payment.model";
import { IPayment } from "./payment.interface";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";

const handleWebhook = async (invoiceToken: string, status: string, transactionId?: string): Promise<IPayment> => {
    const payment = await PaymentModel.findOne({ paydunyaInvoiceToken: invoiceToken });
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
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
    return payment;
};

const webhookController = catchAsync(async (req: Request, res: Response) => {
    const { invoiceToken, status, transactionId } = req.body;
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
