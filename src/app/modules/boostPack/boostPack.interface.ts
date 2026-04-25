export type BoostType = "PRODUCT" | "SHOP";

export interface IBoostPack {
    name: string;
    description?: string;
    type: BoostType;
    duration: number; // in days
    price: number;
    currency: string; // default "FCFA"
    isActive: boolean;
    isRecommended: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
