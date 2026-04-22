import { Types } from "mongoose";

export interface ICategory {
    name: string;
    icon?: string;
    gender?: ("MEN" | "WOMEN" | "KID" | "UNISEX")[];
    isActive: boolean;
    parentCategory?: Types.ObjectId | null;
    homePosition?: number | null;
    homeVisibility: boolean;
    createdAt: Date;
    updatedAt: Date;
}
