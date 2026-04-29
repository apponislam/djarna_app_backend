import mongoose from "mongoose";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { PaymentModel } from "./payment.model";
import { IPayment, Currency, PaymentMethod } from "./payment.interface";
import config from "../../config";
import axios from "axios";
import { SettingsModel } from "../settings/settings.model";
import { UserModel } from "../auth/auth.model";

interface IPaymentInitialize {
    userId: string;
    sellerId: string;
    productId: string;
    messageId?: string;
    addressId?: string;
    productPrice: number;
    buyerProtectionFee: number;
    shippingCost: number;
    currency?: Currency;
    description?: string;
    method?: PaymentMethod;
    metadata?: Record<string, any>;
}

interface IPaymentFilter {
    userId?: string;
    status?: string;
    method?: string;
    startDate?: Date;
    endDate?: Date;
}

const initializePayment = async (payload: IPaymentInitialize): Promise<{ payment: IPayment; invoiceUrl: string; invoiceToken: string }> => {
    console.log("initializePayment called with:", payload);

    // Get commission rate from settings
    const settings = await SettingsModel.findOne();
    const seller = await UserModel.findById(payload.sellerId);

    // Calculations
    const commissionRate = seller?.noCommission && seller.noCommission > 0 ? 0 : settings?.payment?.commissionRate || 8;
    const siteFee = (payload.productPrice * commissionRate) / 100;
    const buyerFee = payload.productPrice - siteFee; // Amount for seller
    const totalAmount = payload.productPrice + payload.buyerProtectionFee + payload.shippingCost;

    // If commission was skipped, decrement seller's noCommission count after successful order

    const payment = await PaymentModel.create({
        userId: new mongoose.Types.ObjectId(payload.userId),
        sellerId: new mongoose.Types.ObjectId(payload.sellerId),
        productId: new mongoose.Types.ObjectId(payload.productId),
        messageId: payload.messageId ? new mongoose.Types.ObjectId(payload.messageId) : undefined,
        addressId: payload.addressId ? new mongoose.Types.ObjectId(payload.addressId) : undefined,
        productPrice: payload.productPrice,
        buyerProtectionFee: payload.buyerProtectionFee,
        shippingCost: payload.shippingCost,
        totalAmount: totalAmount,
        siteFee: siteFee,
        buyerFee: buyerFee,
        currency: payload.currency || "FCFA",
        description: payload.description,
        method: payload.method || "PAYDUNYA",
        status: "PENDING",
        metadata: payload.metadata,
    });

    console.log("Payment record created:", payment._id);

    try {
        const items: any = {};
        let itemIndex = 0;

        items[`item_${itemIndex++}`] = {
            name: "Product Price",
            quantity: 1,
            unit_price: payload.productPrice.toString(),
            total_price: payload.productPrice.toString(),
        };

        items[`item_${itemIndex++}`] = {
            name: "Buyer Protection Fee",
            quantity: 1,
            unit_price: payload.buyerProtectionFee.toString(),
            total_price: payload.buyerProtectionFee.toString(),
        };

        items[`item_${itemIndex++}`] = {
            name: "Shipping Fee",
            quantity: 1,
            unit_price: payload.shippingCost.toString(),
            total_price: payload.shippingCost.toString(),
        };

        const paydunyaResponse = await axios.post(
            "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create",
            {
                invoice: {
                    items,
                    total_amount: totalAmount,
                    description: payload.description || "Payment via Djarna App",
                },
                store: {
                    name: "Djarna App",
                },
                actions: {
                    return_url: `${config.client_url}/payment/success`,
                    cancel_url: `${config.client_url}/payment/cancel`,
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "PAYDUNYA-MASTER-KEY": config.paydunya_master_key,
                    "PAYDUNYA-PRIVATE-KEY": config.paydunya_private_key,
                    "PAYDUNYA-TOKEN": config.paydunya_token,
                },
            },
        );

        console.log("Paydunya Response:", paydunyaResponse.data);

        const invoiceToken = paydunyaResponse.data.token;
        const invoiceUrl = paydunyaResponse.data.response_text;

        if (!invoiceToken) {
            payment.status = "FAILED";
            await payment.save();
            throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create Paydunya invoice");
        }

        payment.paydunyaInvoiceToken = invoiceToken;
        payment.paydunyaReceiptUrl = invoiceUrl;
        await payment.save();

        return {
            payment,
            invoiceUrl: invoiceUrl || "",
            invoiceToken,
        };
    } catch (error: any) {
        console.error("Paydunya API Error:", error.response?.data);
        payment.status = "FAILED";
        await payment.save();
        throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || error.message || "Payment initialization failed");
    }
};

/**
 * Verify payment status (Used for frontend polling/redirection)
 */
const verifyPayment = async (invoiceToken: string): Promise<IPayment> => {
    try {
        const response = await axios.get(`https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/${invoiceToken}`, {
            headers: {
                "PAYDUNYA-MASTER-KEY": config.paydunya_master_key,
                "PAYDUNYA-PRIVATE-KEY": config.paydunya_private_key,
                "PAYDUNYA-TOKEN": config.paydunya_token,
            },
        });

        const payment = await PaymentModel.findOne({ paydunyaInvoiceToken: invoiceToken });
        if (!payment) throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");

        // Just update the status for the frontend success screen
        if (response.data.status === "completed") {
            payment.status = "COMPLETED";
            await payment.save();
        } else if (response.data.status === "failed") {
            payment.status = "FAILED";
            await payment.save();
        }

        return payment;
    } catch (error: any) {
        throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || "Payment verification failed");
    }
};

const getPaymentById = async (id: string): Promise<IPayment> => {
    const payment = await PaymentModel.findById(id).lean();
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
    }
    return payment;
};

const getUserPayments = async (userId: string, filters?: IPaymentFilter): Promise<IPayment[]> => {
    const query: any = { userId };

    if (filters?.status) {
        query.status = filters.status;
    }
    if (filters?.method) {
        query.method = filters.method;
    }
    if (filters?.startDate || filters?.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
            query.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
            query.createdAt.$lte = filters.endDate;
        }
    }

    const payments = await PaymentModel.find(query).sort({ createdAt: -1 }).lean();
    return payments;
};

const getAllPayments = async (filters?: IPaymentFilter): Promise<IPayment[]> => {
    const query: any = {};

    if (filters?.userId) {
        query.userId = filters.userId;
    }
    if (filters?.status) {
        query.status = filters.status;
    }
    if (filters?.method) {
        query.method = filters.method;
    }
    if (filters?.startDate || filters?.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
            query.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
            query.createdAt.$lte = filters.endDate;
        }
    }

    const payments = await PaymentModel.find(query).sort({ createdAt: -1 }).lean();
    return payments;
};

const refundPayment = async (id: string, refundAmount?: number): Promise<IPayment> => {
    const payment = await PaymentModel.findById(id);
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
    }

    if (payment.status !== "COMPLETED") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only completed payments can be refunded");
    }

    const amountToRefund = refundAmount || payment.totalAmount;

    if (amountToRefund > payment.totalAmount) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Refund amount cannot exceed total payment amount");
    }

    try {
        const response = await axios.post(
            `https://paydunya.com/api/v1/refund`,
            {
                invoice_token: payment.paydunyaInvoiceToken,
                amount: amountToRefund,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${config.paydunya_master_key}`,
                },
            },
        );

        if (amountToRefund === payment.totalAmount) {
            payment.status = "REFUNDED";
        } else {
            // Optional: You might want a "PARTIALLY_REFUNDED" status if your interface supports it
            // For now, let's stick to the existing status or just keep it COMPLETED with metadata
            payment.metadata = { ...payment.metadata, lastRefundAmount: amountToRefund, refundedAt: new Date() };
        }

        await payment.save();
        return payment;
    } catch (error: any) {
        throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || "Refund failed");
    }
};

export const PaymentService = {
    initializePayment,
    verifyPayment,
    getPaymentById,
    getUserPayments,
    getAllPayments,
    refundPayment,
};
