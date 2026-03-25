import mongoose, { Schema } from "mongoose";
import { IReport } from "./report.interface";

const ReportSchema = new Schema<IReport>(
    {
        reportId: {
            type: String,
            unique: true,
            required: true,
        },
        type: {
            type: String,
            enum: ["LISTING", "USER"],
            required: true,
        },
        reportedItem: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "type", // Dynamic reference based on type
        },
        reporter: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedUser: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reason: {
            type: String,
            required: [true, "Reason for report is required"],
        },
        details: {
            type: String,
        },
        status: {
            type: String,
            enum: ["OPEN", "IN_REVIEW", "RESOLVED"],
            default: "OPEN",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Pre-save hook to generate Report ID if not provided (e.g., RPT-001)
ReportSchema.pre("validate", async function () {
    const report = this as any;
    if (report.isNew && !report.reportId) {
        try {
            const lastReport = await mongoose.models.Report.findOne({}, {}, { sort: { createdAt: -1 } });
            let nextNum = 1;
            if (lastReport && lastReport.reportId) {
                const currentNum = parseInt(lastReport.reportId.split("-")[1]);
                nextNum = currentNum + 1;
            }
            report.reportId = `RPT-${nextNum.toString().padStart(3, "0")}`;
        } catch (error) {
            throw error;
        }
    }
});

// Indexing for Dashboard & Search
ReportSchema.index({ reportId: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ reporter: 1 });
ReportSchema.index({ reportedUser: 1 });
ReportSchema.index({ createdAt: -1 });

export const ReportModel = mongoose.model<IReport>("Report", ReportSchema);
