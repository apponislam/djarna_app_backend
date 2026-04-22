export type BoostVisibility = "MEDIUM" | "HIGH";
export type BoostType = "PRODUCT" | "SHOP";

export interface IBoostPack {
    name: string;
    description?: string;
    type: BoostType;
    duration: number; // in days
    listingsCount: number; // number of listings that can be boosted
    visibility: BoostVisibility;
    price: number;
    currency: string; // default "FCFA"
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
