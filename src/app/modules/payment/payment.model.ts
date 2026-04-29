import mongoose, { Schema } from "mongoose";
import { IPayment } from "./payment.interface";

const PaymentSchema = new Schema<IPayment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
            index: true,
        },
        sellerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Seller ID is required"],
            index: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product ID is required"],
            index: true,
        },
        messageId: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
        addressId: {
            type: Schema.Types.ObjectId,
        },
        productPrice: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Product price cannot be negative"],
        },
        buyerProtectionFee: {
            type: Number,
            required: [true, "Buyer protection fee is required"],
            min: [0, "Buyer protection fee cannot be negative"],
        },
        shippingCost: {
            type: Number,
            required: [true, "Shipping cost is required"],
            min: [0, "Shipping cost cannot be negative"],
        },
        totalAmount: {
            type: Number,
            required: [true, "Total amount is required"],
            min: [0, "Total amount cannot be negative"],
        },
        buyerFee: {
            type: Number,
            min: [0, "Buyer fee cannot be negative"],
        },
        siteFee: {
            type: Number,
            min: [0, "Site fee cannot be negative"],
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
