import { Types } from "mongoose";

export type DeliveryMethod = "HOME_DELIVERY" | "PICKUP_POINT" | "MEET_UP";
export type OrderStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "COMPLETED";

export interface IOrder {
    buyer: Types.ObjectId;
    seller: Types.ObjectId;
    product: Types.ObjectId;
    address?: Types.ObjectId;
    deliveryMethod: DeliveryMethod;
    status: OrderStatus;

    productPrice: number;
    buyerProtectionFee: number;
    shippingCost: number;
    totalAmount: number;

    buyerFee: number;
    siteFee: number;

    payment?: Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
