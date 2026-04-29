import { Types } from "mongoose";

export type ActivityType = "LOGIN" | "REGISTER" | "PRODUCT_CREATE" | "PRODUCT_UPDATE" | "ORDER_PLACED" | "ORDER_STATUS_UPDATE" | "PAYMENT_COMPLETED" | "WITHDRAWAL_REQUEST" | "DISPUTE_CREATED" | "DISPUTE_RESOLVED" | "REFUND_PROCESSED";

export interface IActivity {
    user: Types.ObjectId;
    type: ActivityType;
    message: string;
    details?: Record<string, any>;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
