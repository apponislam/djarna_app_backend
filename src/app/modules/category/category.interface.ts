import { Types } from "mongoose";

export interface ICategory {
    name: string;
    icon?: string;
    isActive: boolean;
    parentCategory?: Types.ObjectId | null;
    homePosition?: number | null;
    homeVisibility: boolean;
    createdAt: Date;
    updatedAt: Date;
}
