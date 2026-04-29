import { Types } from "mongoose";

export type DisputeStatus = "PENDING" | "IN_REVIEW" | "RESOLVED" | "REJECTED" | "CANCELLED";

export type DisputeReason = "ITEM_NOT_RECEIVED" | "ITEM_NOT_AS_DESCRIBED" | "DAMAGED_ITEM" | "UNAUTHORIZED_TRANSACTION" | "OTHER";

export interface IDispute {
    order: Types.ObjectId;
    payment: Types.ObjectId;
    buyer: Types.ObjectId;
    seller: Types.ObjectId;
    reason: DisputeReason;
    description: string;
    images?: string[];
    status: DisputeStatus;
    adminNote?: string;
    refundAmount?: number;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
