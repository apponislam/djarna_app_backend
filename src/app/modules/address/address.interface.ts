import { Types } from "mongoose";

export interface IShippingAddress {
    user: Types.ObjectId;
    fullName: string;
    country: string;
    addressLine1: string;
    addressLine2?: string;
    postcode: string;
    city: string;
    isDefault: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
