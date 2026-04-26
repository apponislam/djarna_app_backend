import mongoose, { Schema } from "mongoose";
import { IPayment, PaymentStatus, PaymentMethod, Currency } from "./payment.interface";

const PaymentSchema = new Schema<IPayment>(
    {
        userId: {
            type: String,
            required: [true, "User ID is required"],
            index: true,
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0, "Amount cannot be negative"],
        },
        productPrice: {
            type: Number,
            min: [0, "Product price cannot be negative"],
        },
        buyerFee: {
            type: Number,
            min: [0, "Buyer fee cannot be negative"],
        },
        siteFee: {
            type: Number,
            min: [0, "Site fee cannot be negative"],
        },
        shippingFee: {
            type: Number,
            min: [0, "Shipping fee cannot be negative"],
        },
        currency: {
            type: String,
            enum: ["FCFA", "USD", "EUR"],
            default: "FCFA",
        },
        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"],
            default: "PENDING",
            index: true,
        },
        method: {
            type: String,
            enum: ["PAYDUNYA", "CARD", "MOBILE_MONEY", "WALLET", "APPLE_PAY", "GOOGLE_PAY"],
            required: [true, "Payment method is required"],
        },
        transactionId: {
            type: String,
            index: true,
        },
        paydunyaInvoiceToken: {
            type: String,
        },
        paydunyaReceiptUrl: {
            type: String,
        },
        description: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        paidAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

export const PaymentModel = mongoose.model<IPayment>("Payment", PaymentSchema);
