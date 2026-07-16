import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { UserModel } from "../auth/auth.model";
import { FollowModel } from "../follow/follow.model";
import { BlockModel } from "./block.model";

const blockUser = async (blockerId: string, blockedId: string) => {
    if (blockerId === blockedId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Vous ne pouvez pas vous bloquer vous-même");
    }

    const targetUser = await UserModel.findById(blockedId);
    if (!targetUser) {
        throw new ApiError(httpStatus.NOT_FOUND, "Utilisateur introuvable");
    }

    const existingBlock = await BlockModel.findOne({ blocker: blockerId, blocked: blockedId });
    if (existingBlock) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Vous avez déjà bloqué cet utilisateur");
    }

    const result = await BlockModel.create({ blocker: blockerId, blocked: blockedId });

    // Automatically remove follows in both directions
    await FollowModel.deleteMany({
        $or: [
            { follower: blockerId, following: blockedId },
            { follower: blockedId, following: blockerId },
        ],
    });

    return result;
};

const unblockUser = async (blockerId: string, blockedId: string) => {
    const block = await BlockModel.findOneAndDelete({ blocker: blockerId, blocked: blockedId });
    if (!block) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Vous n'avez pas bloqué cet utilisateur");
    }
    return block;
};

const getBlockedUsers = async (blockerId: string, query: Record<string, any> = {}) => {
    const { page = 1, limit = 10 } = query;
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const filters = { blocker: blockerId };

    const blocks = await BlockModel.find(filters)
        .populate("blocked", "name email phone photo verifiedBadge")
        .skip(skip)
        .limit(limitNumber);

    const total = await BlockModel.countDocuments(filters);
    const totalPages = Math.ceil(total / limitNumber);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages,
            hasNext: pageNumber < totalPages,
            hasPrev: pageNumber > 1,
        },
        data: blocks.map(block => block.blocked),
    };
};

/**
 * Helper to check if a block exists between two users in either direction
 */
const isBlocked = async (userA: string, userB: string): Promise<boolean> => {
    const block = await BlockModel.findOne({
        $or: [
            { blocker: userA, blocked: userB },
            { blocker: userB, blocked: userA },
        ],
    });
    return !!block;
};

/**
 * Returns a list of user IDs that are blocked by the user or have blocked the user.
 */
const getBlockedUserIds = async (userId: string): Promise<string[]> => {
    const blocks = await BlockModel.find({
        $or: [
            { blocker: userId },
            { blocked: userId }
        ]
    });

    const userIds = new Set<string>();
    blocks.forEach(block => {
        userIds.add(block.blocker.toString());
        userIds.add(block.blocked.toString());
    });
    userIds.delete(userId); // remove current user's ID

    return Array.from(userIds);
};

export const BlockService = {
    blockUser,
    unblockUser,
    getBlockedUsers,
    isBlocked,
    getBlockedUserIds,
};
