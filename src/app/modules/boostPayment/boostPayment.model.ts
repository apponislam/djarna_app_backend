import { Schema, model } from "mongoose";
import { IBoostPayment } from "./boostPayment.interface";

const BoostPaymentSchema = new Schema<IBoostPayment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: function (this: IBoostPayment) {
                return this.type === "PRODUCT";
            },
        },
        boostPackId: {
            type: Schema.Types.ObjectId,
            ref: "BoostPack",
            required: true,
        },
        type: {
            type: String,
            enum: ["PRODUCT", "SHOP"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "FCFA",
        },
        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
            default: "PENDING",
        },
        paydunyaInvoiceToken: {
            type: String,
        },
        paydunyaReceiptUrl: {
            type: String,
        },
        transactionId: {
            type: String,
        },
        paidAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

// Indexes
BoostPaymentSchema.index({ userId: 1, status: 1 });
BoostPaymentSchema.index({ paydunyaInvoiceToken: 1 });
BoostPaymentSchema.index({ type: 1, status: 1 });

export const BoostPaymentModel = model<IBoostPayment>("BoostPayment", BoostPaymentSchema);
