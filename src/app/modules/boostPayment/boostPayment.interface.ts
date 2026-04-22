import { Types } from "mongoose";

export type BoostPaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface IBoostPayment {
    userId: Types.ObjectId;
    productId?: Types.ObjectId; // Optional: Only if type is PRODUCT
    boostPackId: Types.ObjectId;
    type: "PRODUCT" | "SHOP";
    amount: number;
    currency: string;
    status: BoostPaymentStatus;
    paydunyaInvoiceToken?: string;
    paydunyaReceiptUrl?: string;
    transactionId?: string;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
