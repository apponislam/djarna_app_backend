import { Types } from "mongoose";

export type ActivityType = "LOGIN" | "REGISTER" | "PRODUCT_CREATE" | "PRODUCT_UPDATE" | "PRODUCT_DELETE" | "ORDER_PLACED" | "ORDER_STATUS_UPDATE" | "PAYMENT_COMPLETED" | "WITHDRAWAL_REQUEST" | "DISPUTE_CREATED" | "DISPUTE_RESOLVED" | "DISPUTE_CANCELLED" | "REFUND_PROCESSED" | "FAVORITE_ADD" | "FAVORITE_REMOVE" | "FOLLOW" | "UNFOLLOW" | "IDENTITY_VERIFICATION" | "REPORT_CREATE" | "REPORT_UPDATE" | "REVIEW_CREATE" | "REVIEW_DELETE";

export interface IActivity {
    user: Types.ObjectId;
    type: ActivityType;
    message: string;
    details?: Record<string, any>;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
