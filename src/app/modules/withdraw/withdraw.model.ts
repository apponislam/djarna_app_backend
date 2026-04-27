import { Schema, model } from "mongoose";
import { IWithdraw } from "./withdraw.interface";

const WithdrawSchema = new Schema<IWithdraw>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
            index: true,
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [100, "Minimum withdrawal amount is 100"],
        },
        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
            default: "PENDING",
            index: true,
        },
        method: {
            type: String,
            enum: ["WAVE", "ORANGE_MONEY", "FREE_MONEY", "E_MONEY", "PAYDUNYA"],
            required: [true, "Withdrawal method is required"],
        },
        accountNumber: {
            type: String,
            required: [true, "Account number/phone is required"],
        },
        transactionId: {
            type: String,
            unique: true,
            sparse: true,
        },
        paydunyaTransactionId: {
            type: String,
        },
        paydunyaDisbursementToken: {
            type: String,
        },
        failReason: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const WithdrawModel = model<IWithdraw>("Withdraw", WithdrawSchema);
