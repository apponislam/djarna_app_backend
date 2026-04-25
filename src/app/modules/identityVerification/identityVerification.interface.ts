import { Types } from "mongoose";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type DocumentType = "NID" | "PASSPORT";

export interface IIdentityVerification {
    user: Types.ObjectId;
    documentType: DocumentType;
    frontImage: string;
    backImage?: string;
    selfieImage: string;
    status: VerificationStatus;
    adminComment?: string;
    createdAt: Date;
    updatedAt: Date;
}
