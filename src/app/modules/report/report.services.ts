import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ReportModel } from "./report.model";
import { IReport } from "./report.interface";

const createReport = async (payload: IReport) => {
    const result = await ReportModel.create(payload);
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
        .populate("reporter", "name email phone")
        .populate("reportedUser", "name email phone")
        // Note: populate reportedItem might require specific logic due to refPath,
        // but for listing type we can explicitly populate product details if needed.
        .sort(sortOptions);

    return result;
};

const getReportById = async (id: string) => {
    const result = await ReportModel.findById(id).populate("reporter", "name email phone").populate("reportedUser", "name email phone");

    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
    return result;
};

const updateReportStatus = async (id: string, status: string) => {
    const result = await ReportModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Report not found");
    return result;
};

export const ReportService = {
    createReport,
    getAllReports,
    getReportById,
    updateReportStatus,
};
