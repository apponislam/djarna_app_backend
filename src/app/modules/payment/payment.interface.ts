import { Types } from "mongoose";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";

export type PaymentMethod = "PAYDUNYA" | "CARD" | "MOBILE_MONEY" | "WALLET" | "APPLE_PAY" | "GOOGLE_PAY";

export type Currency = "FCFA" | "USD" | "EUR";

export interface IPayment {
    userId: Types.ObjectId;
    sellerId: Types.ObjectId;
    productId: Types.ObjectId;
    messageId?: Types.ObjectId;
    addressId?: Types.ObjectId;

    productPrice: number;
    buyerProtectionFee: number;
    shippingCost: number;
    totalAmount: number;

    siteFee: number;
    buyerFee: number; // This is the amount after siteFee from productPrice

    currency: Currency;

    status: PaymentStatus;
    method: PaymentMethod;

    transactionId?: string;
    paydunyaInvoiceToken?: string;
    paydunyaReceiptUrl?: string;

    description?: string;
    metadata?: Record<string, any>;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
