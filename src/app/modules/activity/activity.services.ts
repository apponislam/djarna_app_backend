import { ActivityModel } from "./activity.model";
import { ActivityType } from "./activity.interface";
import { emitToAdmin } from "../../socket/socket";

/**
 * Log a new activity
 */
const logActivity = async (userId: string, type: ActivityType, message: string, details?: Record<string, any>) => {
    try {
        console.log(userId, type, message, details);
        const activity = await ActivityModel.create({
            user: userId,
            type,
            message,
            details,
        });

        // Emit real-time activity to admins
        const populatedActivity = await ActivityModel.findById(activity._id).populate("user", "name email photo phone");
        emitToAdmin("new_activity", populatedActivity);
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};

/**
 * Get all activities for admin with pagination
 */
const getAllActivities = async (query: Record<string, any>) => {
    const { page = 1, limit = 10, type, userId } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { isDeleted: false };
    if (type) filter.type = type;
    if (userId) filter.user = userId;

    const total = await ActivityModel.countDocuments(filter);
    const data = await ActivityModel.find(filter).populate("user", "name email photo phone").sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    return {
        meta: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPage: Math.ceil(total / Number(limit)),
        },
        data,
    };
};

/**
 * Get my activities
 */
const getMyActivities = async (userId: string, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;

    const total = await ActivityModel.countDocuments({ user: userId, isDeleted: false });
    const data = await ActivityModel.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 }).skip(skip).limit(limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit),
        },
        data,
    };
};

export const ActivityService = {
    logActivity,
    getAllActivities,
    getMyActivities,
};
