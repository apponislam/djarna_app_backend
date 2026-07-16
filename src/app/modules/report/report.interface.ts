import { Types } from "mongoose";

export type ReportType = "LISTING" | "USER";
export type ReportStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

export interface IReport {
    reportId: string;
    type: ReportType;
    reportedItem?: Types.ObjectId;
    reporter: Types.ObjectId;
    reportedUser: Types.ObjectId;
    reason: string;
    details?: string;
    status: ReportStatus;
    createdAt: Date;
    updatedAt: Date;
}
