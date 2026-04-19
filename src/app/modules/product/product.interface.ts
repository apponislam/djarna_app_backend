import { Types } from "mongoose";

export type ProductStatus = "ACTIVE" | "SOLD" | "PENDING" | "REJECTED" | "DRAFT";

export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL" | "4XL" | "5XL" | "6XL" | "7XL" | "8XL";

export interface IProduct {
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    category: string;
    subcategory: string;
    location?: {
        lat?: number;
        lng?: number;
    };
    address?: string;
    gender?: "MEN" | "WOMEN" | "KID";
    size?: ProductSize;
    user: Types.ObjectId;
    images: string[];
    status: ProductStatus;

    // Boost Fields
    isBoosted: boolean;
    boostPack?: Types.ObjectId | null;
    boostStartTime?: Date | null;
    boostEndTime?: Date | null;

    createdAt: Date;
    updatedAt: Date;
}
