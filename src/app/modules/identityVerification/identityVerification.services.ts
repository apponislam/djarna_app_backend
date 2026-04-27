import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { IdentityVerificationModel } from "./identityVerification.model";
import { IIdentityVerification } from "./identityVerification.interface";

const submitVerification = async (userId: string, payload: Partial<IIdentityVerification>) => {
    const user = await UserModel.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.verifiedBadge) {
        throw new ApiError(httpStatus.BAD_REQUEST, "User is already verified");
    }

    const existingRequest = await IdentityVerificationModel.findOne({ user: userId });
    if (existingRequest && existingRequest.status === "PENDING") {
        throw new ApiError(httpStatus.BAD_REQUEST, "You already have a pending verification request");
    }

    if (existingRequest) {
        // Update existing rejected request
        return await IdentityVerificationModel.findOneAndUpdate({ user: userId }, { ...payload, status: "PENDING", adminComment: "" }, { returnDocument: "after" });
    }

    return await IdentityVerificationModel.create({ ...payload, user: userId });
};

const getMyVerificationStatus = async (userId: string) => {
    return await IdentityVerificationModel.findOne({ user: userId });
};

const getAllVerificationRequests = async (query: any) => {
    const { status, page = 1, limit = 10 } = query;
    const filter: any = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const result = await IdentityVerificationModel.find(filter).populate("user", "name phone photo email verifiedBadge").sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    const total = await IdentityVerificationModel.countDocuments(filter);

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        data: result,
    };
};

const updateVerificationStatus = async (id: string, status: "APPROVED" | "REJECTED", adminComment?: string) => {
    const verification = await IdentityVerificationModel.findById(id);
    if (!verification) {
        throw new ApiError(httpStatus.NOT_FOUND, "Verification request not found");
    }

    if (status === "APPROVED") {
        await UserModel.findByIdAndUpdate(verification.user, { verifiedBadge: true });
    } else {
        await UserModel.findByIdAndUpdate(verification.user, { verifiedBadge: false });
    }

    verification.status = status;
    if (adminComment) verification.adminComment = adminComment;
    await verification.save();

    return verification;
};

export const IdentityVerificationService = {
    submitVerification,
    getMyVerificationStatus,
    getAllVerificationRequests,
    updateVerificationStatus,
};
