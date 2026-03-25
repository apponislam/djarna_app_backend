import { Types } from "mongoose";

export type ReportType = "LISTING" | "USER";
export type ReportStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

export interface IReport {
    reportId: string;
    type: ReportType;
    reportedItem: Types.ObjectId; // Could be Product ID or User ID
    reporter: Types.ObjectId; // User who is reporting
    reportedUser: Types.ObjectId; // User who owns the listing or is being reported
    reason: string;
    details?: string;
    status: ReportStatus;
    createdAt: Date;
    updatedAt: Date;
}
