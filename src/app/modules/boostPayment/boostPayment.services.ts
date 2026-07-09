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
        throw new ApiError(httpStatus.NOT_FOUND, "Pack de boost introuvable ou inactif !");
    }

    // 2. If it's a PRODUCT boost, verify product ownership
    if (boostPack.type === "PRODUCT") {
        if (!productId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "L'identifiant du produit est requis pour le boost de produit !");
        }
        const product = await ProductModel.findOne({ _id: productId, user: userId });
        if (!product) {
            throw new ApiError(httpStatus.NOT_FOUND, "Produit introuvable ou vous n'en êtes pas le propriétaire !");
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
        const invoiceCreateUrl = config.paydunya_mode === "live"
            ? "https://app.paydunya.com/api/v1/checkout-invoice/create"
            : "https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create";

        const paydunyaResponse = await axios.post(
            invoiceCreateUrl,
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
            throw new ApiError(httpStatus.BAD_REQUEST, "Échec de la création de la facture Paydunya");
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
        throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || error.message || "Échec de l'initialisation du paiement");
    }
};

const applyBoostEffects = async (boostPaymentId: string) => {
    const boostPayment = await BoostPaymentModel.findById(boostPaymentId);
    if (!boostPayment || boostPayment.status !== "COMPLETED") {
        return;
    }

    const boostPack = await BoostPackModel.findById(boostPayment.boostPackId);
    if (!boostPack) throw new ApiError(httpStatus.NOT_FOUND, "Pack de boost introuvable lors de la vérification !");

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
        throw new ApiError(httpStatus.NOT_FOUND, "Paiement de boost introuvable");
    }

    if (boostPayment.status === "COMPLETED") {
        return boostPayment;
    }

    try {
        const invoiceConfirmUrl = config.paydunya_mode === "live"
            ? `https://app.paydunya.com/api/v1/checkout-invoice/confirm/${invoiceToken}`
            : `https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/${invoiceToken}`;

        const response = await axios.get(invoiceConfirmUrl, {
            headers: {
                "PAYDUNYA-MASTER-KEY": config.paydunya_master_key,
                "PAYDUNYA-PRIVATE-KEY": config.paydunya_private_key,
                "PAYDUNYA-TOKEN": config.paydunya_token,
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
        throw new ApiError(httpStatus.BAD_REQUEST, error.response?.data?.message || "Échec de la vérification du paiement");
    }
};

const getMyBoostPayments = async (userId: string) => {
    return await BoostPaymentModel.find({ userId: new Types.ObjectId(userId) })
        .populate("boostPackId")
        .populate("productId")
        .sort({ createdAt: -1 })
        .lean();
};

const getAllBoostPayments = async (filters?: {
    userId?: string;
    status?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}) => {
    const query: any = {};

    if (filters?.userId) {
        query.userId = new Types.ObjectId(filters.userId);
    }
    if (filters?.status) {
        query.status = filters.status;
    }
    if (filters?.type) {
        query.type = filters.type;
    }
    if (filters?.startDate || filters?.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
            query.createdAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
            query.createdAt.$lte = filters.endDate;
        }
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await BoostPaymentModel.countDocuments(query);
    const payments = await BoostPaymentModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("userId", "name email phone photo")
        .populate("boostPackId")
        .populate("productId")
        .lean();

    const totalPages = Math.ceil(total / Number(limit));

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: totalPages,
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
        },
        data: payments,
    };
};

const getSingleBoostPayment = async (id: string, userId: string, userRole: string) => {
    const result = await BoostPaymentModel.findById(id)
        .populate("userId", "name email phone photo")
        .populate("boostPackId")
        .populate("productId")
        .lean();

    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Paiement de boost introuvable");
    }

    // Check if user is the owner or an admin
    if (userRole !== "ADMIN" && result.userId.toString() !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "Accès refusé");
    }

    return result;
};

export const BoostPaymentService = {
    initializeBoostPayment,
    verifyBoostPayment,
    getMyBoostPayments,
    getAllBoostPayments,
    applyBoostEffects,
    getSingleBoostPayment,
};

