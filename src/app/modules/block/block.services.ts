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

const getBlockedUsers = async (blockerId: string) => {
    const blocks = await BlockModel.find({ blocker: blockerId }).populate("blocked", "name email phone photo verifiedBadge");
    return blocks.map(block => block.blocked);
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
