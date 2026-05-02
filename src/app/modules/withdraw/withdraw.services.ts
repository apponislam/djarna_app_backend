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

    // 2. Map internal method to PayDunya withdraw_mode
    const methodMapping: Record<WithdrawMethod, string> = {
        WAVE: "wave-senegal",
        ORANGE_MONEY: "orange-money-senegal",
        FREE_MONEY: "free-money-senegal",
        EXPRESSO: "expresso-senegal",
        PAYDUNYA: "paydunya",
    };

    const withdrawMode = methodMapping[payload.method];

    // Clean account_alias (remove +221 or other country codes if present)
    let cleanAccountNumber = payload.accountNumber.replace(/^\+221/, "");
    if (cleanAccountNumber.startsWith("+")) {
        cleanAccountNumber = cleanAccountNumber.substring(1);
    }

    // 3. Create withdrawal record
    const internalId = `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const withdraw = await WithdrawModel.create({
        userId,
        amount: payload.amount,
        method: payload.method,
        accountNumber: payload.accountNumber,
        status: "PENDING",
        transactionId: internalId,
    });

    // 4. Deduct balance immediately (Escrow-like)
    await UserModel.findByIdAndUpdate(userId, {
        $inc: { balance: -payload.amount },
    });

    try {
        // 5. Call Paydunya PUSH API (v2) - Direct URLs as requested
        const getInvoiceUrl = config.paydunya_mode === "live" ? "https://app.paydunya.com/api/v2/disburse/get-invoice" : "https://app.paydunya.com/sandbox-api/v2/disburse/get-invoice";

        const paydunyaResponse = await axios.post(
            getInvoiceUrl,
            {
                disburse: {
                    account_alias: cleanAccountNumber,
                    amount: payload.amount,
                    withdraw_mode: withdrawMode,
                    callback_url: `${config.client_url}/api/v1/payment/webhook`,
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "PAYDUNYA-MASTER-KEY": config.paydunya_master_key,
                    "PAYDUNYA-PRIVATE-KEY": config.paydunya_private_key,
                    "PAYDUNYA-TOKEN": config.paydunya_token,
                },
            },
        );

        console.log("PayDunya Get-Invoice Response:", paydunyaResponse.data);

        if (paydunyaResponse.data.response_code === "00") {
            const disbursementToken = paydunyaResponse.data.disburse_token;

            // Submit the disbursement
            const submitInvoiceUrl = config.paydunya_mode === "live" ? "https://app.paydunya.com/api/v2/disburse/submit-invoice" : "https://app.paydunya.com/sandbox-api/v2/disburse/submit-invoice";

            const submitResponse = await axios.post(
                submitInvoiceUrl,
                {
                    disburse_token: disbursementToken,
                    disburse_id: internalId,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "PAYDUNYA-MASTER-KEY": config.paydunya_master_key,
                        "PAYDUNYA-PRIVATE-KEY": config.paydunya_private_key,
                        "PAYDUNYA-TOKEN": config.paydunya_token,
                    },
                },
            );

            console.log("PayDunya Submit-Invoice Response:", submitResponse.data);

            if (submitResponse.data.response_code === "00") {
                withdraw.status = "PROCESSING";
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
