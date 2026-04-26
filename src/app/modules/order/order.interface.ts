import { Types } from "mongoose";

export type DeliveryMethod = "HOME_DELIVERY" | "PICKUP_POINT" | "MEET_UP";
export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "COMPLETED";

export interface IOrder {
    buyer: Types.ObjectId;
    seller: Types.ObjectId;
    product: Types.ObjectId;
    shippingAddress?: {
        fullName: string;
        country: string;
        addressLine1: string;
        addressLine2?: string;
        postcode: string;
        city: string;
    };
    deliveryMethod: DeliveryMethod;
    status: OrderStatus;
    priceSummary: {
        productPrice: number;
        buyerProtectionFee: number;
        shippingCost: number;
        siteFee: number;
        totalAmount: number;
    };
    payment?: Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
