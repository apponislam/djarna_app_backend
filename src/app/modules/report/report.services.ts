import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ReportModel } from "./report.model";
import { IReport } from "./report.interface";
import { ActivityService } from "../activity/activity.services";
import { escapeRegex } from "../../../utils/escapeRegex";

const createReport = async (payload: IReport) => {
    const result = await ReportModel.create(payload);
    ActivityService.logActivity(payload.reporter.toString(), "REPORT_CREATE", `Signalement soumis pour un(e) ${payload.type.toLowerCase()}`, { reportId: result._id });
    return result;
};

const getAllReports = async (query: any) => {
    const { page = 1, limit = 10, searchTerm, type, status, sortBy = "createdAt", order = "desc" } = query;

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const filters: any = {};

    if (searchTerm) {
        const escapedSearch = escapeRegex(searchTerm);
        filters.$or = [{ reportId: { $regex: escapedSearch, $options: "i" } }, { reason: { $regex: escapedSearch, $options: "i" } }];
    }

    if (type) filters.type = type;
    if (status) filters.status = status;

    const sortOptions: any = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const result = await ReportModel.find(filters)
        .populate("reporter", "name email phone photo verifiedBadge")
        .populate("reportedUser", "name email phone photo verifiedBadge")
        .populate("reportedItem")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber);

    const total = await ReportModel.countDocuments(filters);
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
        data: result,
    };
};

const getReportById = async (id: string) => {
    const result = await ReportModel.findById(id)
        .populate("reporter", "name email phone photo verifiedBadge")
        .populate("reportedUser", "name email phone photo verifiedBadge")
        .populate("reportedItem");

    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Signalement introuvable");
    return result;
};

const updateReportStatus = async (id: string, status: string) => {
    const result = await ReportModel.findByIdAndUpdate(id, { status }, { returnDocument: "after" });
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Signalement introuvable");
    ActivityService.logActivity(result.reporter.toString(), "REPORT_UPDATE", `Signalement #${id} mis à jour : ${status}`, { reportId: id });
    return result;
};

const getReportStats = async () => {
    const total = await ReportModel.countDocuments();
    const open = await ReportModel.countDocuments({ status: "OPEN" });
    const inReview = await ReportModel.countDocuments({ status: "IN_REVIEW" });
    const resolved = await ReportModel.countDocuments({ status: "RESOLVED" });
    const listing = await ReportModel.countDocuments({ type: "LISTING" });
    const user = await ReportModel.countDocuments({ type: "USER" });

    return {
        total,
        status: {
            open,
            inReview,
            resolved,
        },
        type: {
            listing,
            user,
        },
    };
};

export const ReportService = {
    createReport,
    getAllReports,
    getReportById,
    updateReportStatus,
    getReportStats,
};
