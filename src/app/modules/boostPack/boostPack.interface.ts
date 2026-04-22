export type BoostType = "PRODUCT" | "SHOP";

export interface IBoostPack {
    name: string;
    description?: string;
    type: BoostType;
    duration: number; // in days
    listingsCount: number; // number of listings that can be boosted
    price: number;
    currency: string; // default "FCFA"
    isActive: boolean;
    isRecommended: boolean;
    createdAt: Date;
    updatedAt: Date;
}
