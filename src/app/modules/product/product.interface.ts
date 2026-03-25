import { Types } from "mongoose";

export type ProductStatus = "ACTIVE" | "SOLD" | "PENDING" | "REJECTED";
export type BoostPlan = "7-DAY" | "14-DAY" | "30-DAY" | null;

export interface IProduct {
    title: string;
    description: string;
    price: number;
    category: Types.ObjectId;
    subcategory: Types.ObjectId;
    user: Types.ObjectId;
    images: string[];
    status: ProductStatus;

    // Boost Fields
    isBoosted: boolean;
    boostPlan: BoostPlan;
    boostStartTime?: Date | null;
    boostEndTime?: Date | null;

    createdAt: Date;
    updatedAt: Date;
}
