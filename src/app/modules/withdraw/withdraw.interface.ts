import { Types } from "mongoose";

export type WithdrawStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type WithdrawMethod = "WAVE" | "ORANGE_MONEY" | "FREE_MONEY" | "E_MONEY" | "PAYDUNYA";

export interface IWithdraw {
    userId: Types.ObjectId;
    amount: number;
    status: WithdrawStatus;
    method: WithdrawMethod;
    accountNumber: string; // Phone number or Paydunya email/token
    transactionId?: string; // Our internal ID
    paydunyaTransactionId?: string; // Paydunya's transaction ID
    paydunyaDisbursementToken?: string;
    failReason?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
