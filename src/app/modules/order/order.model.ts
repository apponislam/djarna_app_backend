import { Schema, model } from "mongoose";
import { IOrder } from "./order.interface";

const OrderSchema = new Schema<IOrder>(
    {
        buyer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        shippingAddress: {
            fullName: String,
            country: String,
            addressLine1: String,
            addressLine2: String,
            postcode: String,
            city: String,
        },
        deliveryMethod: {
            type: String,
            enum: ["HOME_DELIVERY", "PICKUP_POINT", "MEET_UP"],
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "COMPLETED"],
            default: "PENDING",
        },
        priceSummary: {
            productPrice: { type: Number, required: true },
            buyerProtectionFee: { type: Number, required: true },
            shippingCost: { type: Number, required: true },
            siteFee: { type: Number, required: true },
            totalAmount: { type: Number, required: true },
        },
        payment: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
        },
    },
);

export const OrderModel = model<IOrder>("Order", OrderSchema);
