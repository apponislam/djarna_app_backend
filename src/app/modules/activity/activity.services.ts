import mongoose from "mongoose";
import { ActivityModel } from "./activity.model";
import { ActivityType } from "./activity.interface";
import { emitToAdmin } from "../../socket/socket";

/**
 * Log a new activity
 */
const logActivity = async (userId: any, type: ActivityType, message: string, details?: Record<string, any>) => {
    // Fire and forget, but handle errors internally to not crash the background process
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error("Invalid userId for activity logging:", userId);
            return;
        }

        const activity = await ActivityModel.create({
            user: new mongoose.Types.ObjectId(userId),
            type,
            message,
            details,
        });

        // Populate and emit to admins for real-time updates
        const populatedActivity = await ActivityModel.findById(activity._id).populate("user", "name email photo phone");
        if (populatedActivity) {
            emitToAdmin("new_activity", populatedActivity);
        }
    } catch (error) {
        console.error("Failed to log activity in background:", error);
    }
};

/**
 * Get all activities for admin with pagination
 */
const getAllActivities = async (query: Record<string, any>) => {
    const { page = 1, limit = 10, type, userId, searchTerm, startDate, endDate } = query;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const filter: any = { isDeleted: false };
    if (type) filter.type = type;

    if (userId) {
        if (mongoose.Types.ObjectId.isValid(userId)) {
            filter.user = userId;
        } else {
            // If invalid userId is passed, return empty data
            return {
                meta: { page: pageNumber, limit: limitNumber, total: 0, totalPage: 0 },
                data: [],
            };
        }
    }

    // Add search functionality
    if (searchTerm) {
        filter.$or = [{ message: { $regex: searchTerm, $options: "i" } }, { "details.productId": mongoose.Types.ObjectId.isValid(searchTerm) ? new mongoose.Types.ObjectId(searchTerm) : null }, { "details.orderId": mongoose.Types.ObjectId.isValid(searchTerm) ? new mongoose.Types.ObjectId(searchTerm) : null }].filter((item) => item !== null && Object.values(item)[0] !== null);

        // If details search didn't yield valid filters, just search message
        if (filter.$or.length === 0) {
            filter.$or = [{ message: { $regex: searchTerm, $options: "i" } }];
        }
    }

    // Date range filtering
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    const total = await ActivityModel.countDocuments(filter);
    const data = await ActivityModel.find(filter).populate("user", "name email photo phone").sort({ createdAt: -1 }).skip(skip).limit(limitNumber);

    return {
        meta: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPage: Math.ceil(total / limitNumber),
        },
        data,
    };
};

export const ActivityService = {
    logActivity,
    getAllActivities,
};
