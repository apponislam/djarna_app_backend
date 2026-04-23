import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { BoostPackModel } from "../boostPack/boostPack.model";
import { ProductModel } from "../product/product.model";
import { UserModel } from "../auth/auth.model";
import { BoostPaymentModel } from "./boostPayment.model";
import axios from "axios";
import config from "../../config";
import { Types } from "mongoose";

const initializeBoostPayment = async (userId: string, boostPackId: string, productId?: string) => {
    // 1. Verify Boost Pack
    const boostPack = await BoostPackModel.findById(boostPackId);
    if (!boostPack || !boostPack.isActive) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found or inactive!");
    }

    // 2. If it's a PRODUCT boost, verify product ownership
    if (boostPack.type === "PRODUCT") {
        if (!productId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Product ID is required for Product Boost!");
        }
        const product = await ProductModel.findOne({ _id: productId, user: userId });
        if (!product) {
            throw new ApiError(httpStatus.NOT_FOUND, "Product not found or you are not the owner!");
        }
    }

    // 3. Create Pending Boost Payment Record
    const boostPayment = await BoostPaymentModel.create({
        userId: new Types.ObjectId(userId),
        productId: productId ? new Types.ObjectId(productId) : undefined,
        boostPackId: boostPack._id,
        type: boostPack.type,
        amount: boostPack.price,
        currency: boostPack.currency || "FCFA",
        status: "PENDING",
    });

    try {
        // 4. Initialize Paydunya Invoice
        const paydunyaResponse = await axios.post(
            "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create",
            {
                invoice: {
                    items: {
                        item_0: {
                            name: `Boost: ${boostPack.name}`,
                            quantity: 1,
                            unit_price: boostPack.price.toString(),
                            total_price: boostPack.price.toString(),
                        },
                    },
                    total_amount: boostPack.price,
                    description: `Boost Payment for ${boostPack.type === "PRODUCT" ? "Product" : "Shop"}`,
                },
                store: {
                    name: "Djarna App",
                },
                actions: {
                    return_url: `${config.client_url}/payment/success`,
                    cancel_url: `${config.client_url}/payment/cancel`,
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

        const invoiceToken = paydunyaResponse.data.token;
        const invoiceUrl = paydunyaResponse.data.response_text;

        if (!invoiceToken) {
            boostPayment.status = "FAILED";
            await boostPayment.save();
            throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create Paydunya invoice");
        }

        // 5. Update Payment Record with Paydunya info
        boostPayment.paydunyaInvoiceToken = invoiceToken;
        boostPayment.paydunyaReceiptUrl = invoiceUrl;
        await boostPayment.save();

        return {
            payment: boostPayment,
            invoiceUrl: invoiceUrl || "",
            invoiceToken,
        };
    } catch (error: any) {
        console.error("Paydunya API Error:", error.response?.data);
        boostPayment.status = "FAILED";
        await boostPayment.save();
        throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || error.message || "Payment initialization failed");
    }
};

const applyBoostEffects = async (boostPaymentId: string) => {
    const boostPayment = await BoostPaymentModel.findById(boostPaymentId);
    if (!boostPayment || boostPayment.status !== "COMPLETED") {
        return;
    }

    const boostPack = await BoostPackModel.findById(boostPayment.boostPackId);
    if (!boostPack) throw new ApiError(httpStatus.NOT_FOUND, "Boost Pack not found during verification!");

    const startTime = new Date();
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + boostPack.duration);

    if (boostPayment.type === "PRODUCT") {
        // Apply to single product
        await ProductModel.findByIdAndUpdate(boostPayment.productId, {
            isBoosted: true,
            boostPack: boostPack._id,
            boostStartTime: startTime,
            boostEndTime: endTime,
        });
    } else if (boostPayment.type === "SHOP") {
        // Apply to all products of the user except SOLD items
        await ProductModel.updateMany(
            {
                user: boostPayment.userId,
                status: { $ne: "SOLD" },
                isDeleted: false,
            },
            {
                isBoosted: true,
                boostPack: boostPack._id,
                boostStartTime: startTime,
                boostEndTime: endTime,
            },
        );
    }
};

const verifyBoostPayment = async (invoiceToken: string) => {
    const boostPayment = await BoostPaymentModel.findOne({ paydunyaInvoiceToken: invoiceToken });
    if (!boostPayment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost payment not found");
    }

    if (boostPayment.status === "COMPLETED") {
        return boostPayment;
    }

    try {
        const response = await axios.get(`https://paydunya.com/api/v1/invoice/status/${invoiceToken}`, {
            headers: {
                Authorization: `Bearer ${config.paydunya_master_key}`,
            },
        });

        const isPaid = response.data?.response?.status === "completed";

        if (isPaid) {
            // 1. Mark Payment as Completed
            boostPayment.status = "COMPLETED";
            boostPayment.paidAt = new Date();
            boostPayment.transactionId = response.data?.response?.transaction_id;
            await boostPayment.save();

            // 2. Apply Boost Effects
            await applyBoostEffects(boostPayment._id.toString());
        } else {
            boostPayment.status = "FAILED";
            await boostPayment.save();
        }

        return boostPayment;
    } catch (error: any) {
        throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || "Payment verification failed");
    }
};

const getMyBoostPayments = async (userId: string) => {
    return await BoostPaymentModel.find({ userId: new Types.ObjectId(userId) })
        .populate("boostPackId")
        .populate("productId", "name images")
        .sort({ createdAt: -1 })
        .lean();
};

export const BoostPaymentService = {
    initializeBoostPayment,
    verifyBoostPayment,
    getMyBoostPayments,
    applyBoostEffects,
};
