import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ReportModel } from "./report.model";
import { IReport } from "./report.interface";
import { ActivityService } from "../activity/activity.services";

const createReport = async (payload: IReport) => {
    const result = await ReportModel.create(payload);
    ActivityService.logActivity(payload.reporter.toString(), "REPORT_CREATE", `Signalement soumis pour un(e) ${payload.type.toLowerCase()}`, { reportId: result._id });
    return result;
};

const getAllReports = async (query: any) => {
    const { searchTerm, type, status, sortBy = "createdAt", order = "desc" } = query;

    const filters: any = {};

    if (searchTerm) {
        filters.$or = [{ reportId: { $regex: searchTerm, $options: "i" } }, { reason: { $regex: searchTerm, $options: "i" } }];
    }

    if (type) filters.type = type;
    if (status) filters.status = status;

    const sortOptions: any = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const result = await ReportModel.find(filters)
        .populate("reporter", "name email phone verifiedBadge")
        .populate("reportedUser", "name email phone verifiedBadge")
        // Note: populate reportedItem might require specific logic due to refPath,
        // but for listing type we can explicitly populate product details if needed.
        .sort(sortOptions);

    return result;
};

const getReportById = async (id: string) => {
    const result = await ReportModel.findById(id).populate("reporter", "name email phone verifiedBadge").populate("reportedUser", "name email phone verifiedBadge");

    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Signalement introuvable");
    return result;
};

const updateReportStatus = async (id: string, status: string) => {
    const result = await ReportModel.findByIdAndUpdate(id, { status }, { returnDocument: "after" });
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Signalement introuvable");
    ActivityService.logActivity(result.reporter.toString(), "REPORT_UPDATE", `Signalement #${id} mis à jour : ${status}`, { reportId: id });
    return result;
};

export const ReportService = {
    createReport,
    getAllReports,
    getReportById,
    updateReportStatus,
};
