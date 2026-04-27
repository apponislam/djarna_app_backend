import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { WithdrawModel } from "./withdraw.model";
import { IWithdraw, WithdrawMethod } from "./withdraw.interface";
import axios from "axios";
import config from "../../config";

const requestWithdrawal = async (userId: string, payload: { amount: number; method: WithdrawMethod; accountNumber: string }) => {
    // 1. Validate user and balance
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.balance < payload.amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Insufficient balance");
    }

    // 2. Create withdrawal record
    const internalId = `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const withdraw = await WithdrawModel.create({
        userId,
        amount: payload.amount,
        method: payload.method,
        accountNumber: payload.accountNumber,
        status: "PENDING",
        transactionId: internalId,
    });

    // 3. Deduct balance immediately (Escrow-like)
    // We deduct it now so they can't double-spend while the request is pending.
    // If it fails, we will refund it.
    await UserModel.findByIdAndUpdate(userId, {
        $inc: { balance: -payload.amount },
    });

    try {
        // 4. Call Paydunya PUSH API
        // This is a simplified version of Paydunya's disbursement flow
        const paydunyaResponse = await axios.post(
            "https://app.paydunya.com/sandbox-api/v1/disburse/get-invoice",
            {
                disburse: {
                    item: {
                        name: `Withdrawal for ${user.name}`,
                        price: payload.amount,
                    },
                    receiver: payload.accountNumber,
                    method: payload.method, // E.g., WAVE, ORANGE_MONEY
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "PAYDUNYA-MASTER-KEY": config.paydunya_master_key,
                    "PAYDUNYA-PRIVATE-KEY": config.paydunya_private_key,
                    "PAYDUNYA-TOKEN": config.paydunya_token,
                },
            }
        );

        if (paydunyaResponse.data.response_code === "00") {
            const disbursementToken = paydunyaResponse.data.disburse_token;
            
            // Submit the disbursement
            const submitResponse = await axios.post(
                "https://app.paydunya.com/sandbox-api/v1/disburse/submit-invoice",
                {
                    disburse_token: disbursementToken,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "PAYDUNYA-MASTER-KEY": config.paydunya_master_key,
                        "PAYDUNYA-PRIVATE-KEY": config.paydunya_private_key,
                        "PAYDUNYA-TOKEN": config.paydunya_token,
                    },
                }
            );

            if (submitResponse.data.response_code === "00") {
                withdraw.paydunyaDisbursementToken = disbursementToken;
                withdraw.paydunyaTransactionId = submitResponse.data.transaction_id;
                await withdraw.save();
            } else {
                throw new Error(submitResponse.data.response_text || "Paydunya submission failed");
            }
        } else {
            throw new Error(paydunyaResponse.data.response_text || "Paydunya invoice creation failed");
        }

        return withdraw;
    } catch (error: any) {
        console.error("Withdrawal Error:", error.response?.data || error.message);
        
        // If Paydunya fails, we should probably keep it as PENDING and let an admin check,
        // or fail it and refund the user. For now, let's fail it and refund.
        withdraw.status = "FAILED";
        withdraw.failReason = error.response?.data?.response_text || error.message;
        await withdraw.save();

        // Refund the user
        await UserModel.findByIdAndUpdate(userId, {
            $inc: { balance: payload.amount },
        });

        throw new ApiError(httpStatus.BAD_REQUEST, withdraw.failReason || "Withdrawal failed");
    }
};

const getMyWithdrawals = async (userId: string) => {
    return await WithdrawModel.find({ userId }).sort({ createdAt: -1 });
};

const getAllWithdrawals = async (filters: any) => {
    return await WithdrawModel.find(filters).populate("userId", "name email phone").sort({ createdAt: -1 });
};

export const WithdrawService = {
    requestWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
};
