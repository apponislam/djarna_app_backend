import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { PaymentModel } from "./payment.model";
import { IPayment } from "./payment.interface";
import config from "../../config";
import axios from "axios";
import { OrderModel } from "../order/order.model";
import { ProductModel } from "../product/product.model";

interface IPaymentInitialize {
    userId: string;
    amount: number;
    productPrice?: number;
    buyerFee?: number;
    siteFee?: number;
    shippingFee?: number;
    currency?: string;
    description?: string;
    method?: string;
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

    const payment = await PaymentModel.create({
        userId: payload.userId,
        amount: payload.amount,
        productPrice: payload.productPrice,
        buyerFee: payload.buyerFee,
        siteFee: payload.siteFee,
        shippingFee: payload.shippingFee,
        currency: payload.currency || "FCFA",
        description: payload.description,
        method: payload.method || "PAYDUNYA",
        status: "PENDING",
        metadata: payload.metadata,
    });

    console.log("Payment record created:", payment._id);

    try {
        console.log("Paydunya Config:", {
            hasMasterKey: !!config.paydunya_master_key,
            masterKeyLength: config.paydunya_master_key?.length,
            hasPublicKey: !!config.paydunya_public_key,
            hasPrivateKey: !!config.paydunya_private_key,
            hasToken: !!config.paydunya_token,
        });

        const items: any = {};
        let itemIndex = 0;

        if (payload.productPrice) {
            items[`item_${itemIndex++}`] = {
                name: "Product Price",
                quantity: 1,
                unit_price: payload.productPrice.toString(),
                total_price: payload.productPrice.toString(),
            };
        }

        if (payload.buyerFee) {
            items[`item_${itemIndex++}`] = {
                name: "Buyer Protection Fee",
                quantity: 1,
                unit_price: payload.buyerFee.toString(),
                total_price: payload.buyerFee.toString(),
            };
        }

        if (payload.shippingFee) {
            items[`item_${itemIndex++}`] = {
                name: "Shipping Fee",
                quantity: 1,
                unit_price: payload.shippingFee.toString(),
                total_price: payload.shippingFee.toString(),
            };
        }

        // Fallback if no detailed breakdown provided
        if (itemIndex === 0) {
            items[`item_0`] = {
                name: payload.description || "Payment",
                quantity: 1,
                unit_price: payload.amount.toString(),
                total_price: payload.amount.toString(),
            };
        }

        const paydunyaResponse = await axios.post(
            "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create",
            {
                invoice: {
                    items,
                    total_amount: payload.amount,
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

const verifyPayment = async (invoiceToken: string): Promise<IPayment> => {
    const payment = await PaymentModel.findOne({ paydunyaInvoiceToken: invoiceToken });
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
    }

    if (payment.status === "COMPLETED") {
        return payment;
    }

    try {
        const response = await axios.get(`https://paydunya.com/api/v1/invoice/status/${invoiceToken}`, {
            headers: {
                Authorization: `Bearer ${config.paydunya_master_key}`,
            },
        });

        const isPaid = response.data?.response?.status === "completed";

        if (isPaid) {
            payment.status = "COMPLETED";
            payment.paidAt = new Date();
            payment.transactionId = response.data?.response?.transaction_id;
            await payment.save();

            // Handle Order Update if metadata contains orderId
            if (payment.metadata && payment.metadata.orderId && payment.metadata.type === "PRODUCT_ORDER") {
                const order = await OrderModel.findById(payment.metadata.orderId);
                if (order) {
                    order.status = "PAID";
                    await order.save();
                    // Update product status
                    await ProductModel.findByIdAndUpdate(order.product, { status: "SOLD" });
                }
            }
        } else {
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

const refundPayment = async (id: string): Promise<IPayment> => {
    const payment = await PaymentModel.findById(id);
    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
    }

    if (payment.status !== "COMPLETED") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only completed payments can be refunded");
    }

    try {
        await axios.post(
            `https://paydunya.com/api/v1/refund`,
            {
                invoice_token: payment.paydunyaInvoiceToken,
                amount: payment.amount,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${config.paydunya_master_key}`,
                },
            },
        );

        payment.status = "REFUNDED";
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
