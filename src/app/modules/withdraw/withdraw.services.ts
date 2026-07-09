import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { WithdrawModel } from "./withdraw.model";
import { IWithdraw, WithdrawMethod } from "./withdraw.interface";
import axios from "axios";
import config from "../../config";
import { ActivityService } from "../activity/activity.services";

const requestWithdrawal = async (userId: string, payload: { amount: number; method: WithdrawMethod; accountNumber: string }) => {
    // 1. Validate user and balance
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");
    }

    if (user.balance < payload.amount) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Solde insuffisant");
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

    // Format account_alias to be in the form: XXXXXXXXX (local number without the country code '221', as required by PayDunya documentation)
    let cleanAccountNumber = payload.accountNumber.replace(/[^\d]/g, ""); // Keep only digits
    cleanAccountNumber = cleanAccountNumber.replace(/^00/, "");          // Remove international prefix '00' if present
    cleanAccountNumber = cleanAccountNumber.replace(/^221/, "");         // Remove Senegal country code '221' if present
    cleanAccountNumber = cleanAccountNumber.replace(/^0+/, "");          // Remove any leading zeroes (local 0)

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
                account_alias: cleanAccountNumber,
                amount: payload.amount,
                withdraw_mode: withdrawMode,
                callback_url: `${config.backend_url}/api/v1/payment/webhook`,
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

        console.log("PayDunya Get-Invoice Full Response:", JSON.stringify(paydunyaResponse.data, null, 2));

        if (paydunyaResponse.data.response_code === "00") {
            const disbursementToken = paydunyaResponse.data.disburse_token;

            // Submit the disbursement
            const submitInvoiceUrl = config.paydunya_mode === "live" ? "https://app.paydunya.com/api/v2/disburse/submit-invoice" : "https://app.paydunya.com/sandbox-api/v2/disburse/submit-invoice";

            const submitResponse = await axios.post(
                submitInvoiceUrl,
                {
                    disburse_invoice: disbursementToken,
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

            console.log("PayDunya Submit-Invoice Full Response:", JSON.stringify(submitResponse.data, null, 2));

            if (submitResponse.data.response_code === "00") {
                withdraw.status = "PROCESSING";
                withdraw.paydunyaDisbursementToken = disbursementToken;
                withdraw.paydunyaTransactionId = submitResponse.data.transaction_id;
                await withdraw.save();
                ActivityService.logActivity(userId, "WITHDRAWAL_REQUEST", `Demande de retrait de ${payload.amount} FCFA soumise via ${payload.method}`, { withdrawalId: withdraw._id });
            } else {
                console.error("PayDunya Submit-Invoice Failure Payload:", JSON.stringify(submitResponse.data, null, 2));
                throw new Error(JSON.stringify(submitResponse.data));
            }
        } else {
            console.error("PayDunya Get-Invoice Failure Payload:", JSON.stringify(paydunyaResponse.data, null, 2));
            throw new Error(JSON.stringify(paydunyaResponse.data));
        }

        return withdraw;
    } catch (error: any) {
        if (error.response) {
            console.error("PayDunya Error Response Data:", JSON.stringify(error.response.data, null, 2));
            console.error("PayDunya Error Response Status:", error.response.status);
        } else {
            console.error("Withdrawal Error Message:", error.message);
        }

        // If Paydunya fails, we should probably keep it as PENDING and let an admin check,
        // or fail it and refund the user. For now, let's fail it and refund.
        withdraw.status = "FAILED";
        withdraw.failReason = error.response ? JSON.stringify(error.response.data) : error.message;
        await withdraw.save();
        ActivityService.logActivity(userId, "WITHDRAWAL_REQUEST", `Échec de la demande de retrait de ${payload.amount} FCFA : ${withdraw.failReason}`, { withdrawalId: withdraw._id });

        // Refund the user
        await UserModel.findByIdAndUpdate(userId, {
            $inc: { balance: payload.amount },
        });

        throw new ApiError(httpStatus.BAD_REQUEST, withdraw.failReason || "Échec du retrait");
    }
};

const getMyWithdrawals = async (userId: string, query: { page?: number; limit?: number }) => {
    const { page = 1, limit = 10 } = query;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const data = await WithdrawModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await WithdrawModel.countDocuments({ userId });
    const totalPage = Math.ceil(total / limitNumber);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPage,
            totalPages: totalPage,
            hasNext: pageNumber < totalPage,
            hasPrev: pageNumber > 1,
        },
        data,
    };
};

const getAllWithdrawals = async (query: any) => {
    const { page = 1, limit = 10, ...filters } = query;
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const data = await WithdrawModel.find(filters)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

    const total = await WithdrawModel.countDocuments(filters);
    const totalPage = Math.ceil(total / limitNumber);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPage,
            totalPages: totalPage,
            hasNext: pageNumber < totalPage,
            hasPrev: pageNumber > 1,
        },
        data,
    };
};

export const WithdrawService = {
    requestWithdrawal,
    getMyWithdrawals,
    getAllWithdrawals,
};
