import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { IdentityVerificationModel } from "./identityVerification.model";
import { IIdentityVerification } from "./identityVerification.interface";
import { ActivityService } from "../activity/activity.services";

const submitVerification = async (userId: string, payload: Partial<IIdentityVerification>) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");
    }

    if (user.verifiedBadge) {
        throw new ApiError(httpStatus.BAD_REQUEST, "L'utilisateur est déjà vérifié");
    }

    const existingRequest = await IdentityVerificationModel.findOne({ user: userId });
    if (existingRequest && existingRequest.status === "PENDING") {
        throw new ApiError(httpStatus.BAD_REQUEST, "Vous avez déjà une demande de vérification en attente");
    }

    if (existingRequest) {
        // Update existing rejected request
        const updated = await IdentityVerificationModel.findOneAndUpdate({ user: userId }, { ...payload, status: "PENDING", adminComment: "" }, { returnDocument: "after" });
        ActivityService.logActivity(userId, "IDENTITY_VERIFICATION", "Demande de vérification d'identité mise à jour");
        return updated;
    }

    const created = await IdentityVerificationModel.create({ ...payload, user: userId });
    ActivityService.logActivity(userId, "IDENTITY_VERIFICATION", "Demande de vérification d'identité soumise");
    return created;
};

const getMyVerificationStatus = async (userId: string) => {
    return await IdentityVerificationModel.findOne({ user: userId });
};

const getAllVerificationRequests = async (query: any) => {
    const { status, page = 1, limit = 10, searchTerm } = query;
    const filter: any = {};
    if (status) filter.status = status;

    if (searchTerm) {
        const users = await UserModel.find({
            $or: [
                { name: { $regex: searchTerm, $options: "i" } },
                { email: { $regex: searchTerm, $options: "i" } },
                { phone: { $regex: searchTerm, $options: "i" } }
            ]
        }).select("_id");
        const userIds = users.map(u => u._id);
        filter.user = { $in: userIds };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const result = await IdentityVerificationModel.find(filter).populate("user", "name phone photo email verifiedBadge").sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    const total = await IdentityVerificationModel.countDocuments(filter);

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
        data: result,
    };
};

const updateVerificationStatus = async (id: string, status: "APPROVED" | "REJECTED", adminComment?: string) => {
    const verification = await IdentityVerificationModel.findById(id);
    if (!verification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Demande de vérification introuvable");
    }

    if (status === "APPROVED") {
        await UserModel.findByIdAndUpdate(verification.user, { verifiedBadge: true });
    } else {
        await UserModel.findByIdAndUpdate(verification.user, { verifiedBadge: false });
    }

    verification.status = status;
    if (adminComment) verification.adminComment = adminComment;
    await verification.save();

    ActivityService.logActivity(verification.user.toString(), "IDENTITY_VERIFICATION", `Demande de vérification d'identité ${status === "APPROVED" ? "approuvée" : "rejetée"}`);

    return verification;
};

export const IdentityVerificationService = {
    submitVerification,
    getMyVerificationStatus,
    getAllVerificationRequests,
    updateVerificationStatus,
};
